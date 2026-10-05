-- Expiring daily free credits are kept separate from durable credits.
ALTER TABLE public.credit_balances
  ADD COLUMN IF NOT EXISTS daily_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_credit_date date;

-- Replace the old claim implementation: daily grants never enter the durable balance.
CREATE OR REPLACE FUNCTION public.claim_daily_credits(
  p_workspace_id uuid,
  p_amount integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.subscription_plan;
  v_date date := CURRENT_DATE;
BEGIN
  SELECT plan INTO v_plan FROM public.subscriptions
  WHERE workspace_id = p_workspace_id;

  IF COALESCE(v_plan, 'free') <> 'free' OR p_amount <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.daily_credit_claims (workspace_id, claim_date, amount)
  VALUES (p_workspace_id, v_date, p_amount)
  ON CONFLICT (workspace_id, claim_date) DO NOTHING;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.credit_balances (workspace_id, balance, daily_balance, daily_credit_date)
  VALUES (p_workspace_id, 0, p_amount, v_date)
  ON CONFLICT (workspace_id) DO UPDATE SET
    daily_balance = p_amount,
    daily_credit_date = v_date,
    updated_at = now();

  INSERT INTO public.credit_transactions (workspace_id, transaction_type, amount, balance_after, description, metadata)
  SELECT p_workspace_id, 'daily_grant', p_amount, cb.balance + cb.daily_balance,
    'Daily free credits', jsonb_build_object('daily', true, 'claim_date', v_date)
  FROM public.credit_balances cb WHERE cb.workspace_id = p_workspace_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_job_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_daily integer;
  v_date date;
  v_daily_used integer;
  v_durable_used integer;
  v_plan public.subscription_plan;
  v_new_balance integer;
  v_new_daily integer;
  v_version integer;
  v_tx_id uuid;
BEGIN
  SELECT balance, daily_balance, daily_credit_date, version
    INTO v_balance, v_daily, v_date, v_version
  FROM public.credit_balances WHERE workspace_id = p_workspace_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NO_BALANCE: No credit balance found for workspace %', p_workspace_id; END IF;

  SELECT plan INTO v_plan FROM public.subscriptions WHERE workspace_id = p_workspace_id;
  IF COALESCE(v_plan, 'free') <> 'free' THEN
    v_daily := 0;
  END IF;

  IF v_date IS DISTINCT FROM CURRENT_DATE THEN
    v_daily := 0;
    v_date := CURRENT_DATE;
  END IF;

  IF v_daily + v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: have %, need %', v_daily + v_balance, p_amount;
  END IF;

  v_daily_used := LEAST(v_daily, p_amount);
  v_durable_used := p_amount - v_daily_used;
  v_new_daily := v_daily - v_daily_used;
  v_new_balance := v_balance - v_durable_used;

  UPDATE public.credit_balances
  SET balance = v_new_balance, daily_balance = v_new_daily, daily_credit_date = v_date,
      version = v_version + 1, updated_at = now()
  WHERE workspace_id = p_workspace_id AND version = v_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'CONCURRENT_MODIFICATION: credit balance was modified concurrently'; END IF;

  INSERT INTO public.credit_transactions
    (workspace_id, user_id, transaction_type, amount, balance_after, job_id, description, metadata)
  VALUES (p_workspace_id, p_user_id, 'generation_deduct', -p_amount,
    v_new_balance + v_new_daily, p_job_id, p_description,
    jsonb_build_object('daily_used', v_daily_used, 'durable_used', v_durable_used, 'credit_date', v_date))
  RETURNING id INTO v_tx_id;
  RETURN v_tx_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_job_id uuid,
  p_description text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_daily integer;
  v_date date;
  v_version integer;
  v_daily_refund integer := 0;
  v_durable_refund integer := p_amount;
  v_source jsonb;
  v_tx_id uuid;
BEGIN
  IF p_job_id IS NOT NULL THEN
    SELECT metadata INTO v_source FROM public.credit_transactions
    WHERE job_id = p_job_id AND transaction_type = 'generation_deduct'
    ORDER BY created_at DESC LIMIT 1;
    IF v_source IS NOT NULL AND (v_source->>'credit_date')::date = CURRENT_DATE THEN
      v_daily_refund := LEAST(p_amount, COALESCE((v_source->>'daily_used')::integer, 0));
      v_durable_refund := p_amount - v_daily_refund;
    END IF;
  END IF;

  SELECT balance, daily_balance, daily_credit_date, version INTO v_balance, v_daily, v_date, v_version
  FROM public.credit_balances WHERE workspace_id = p_workspace_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NO_BALANCE: No credit balance found for workspace %', p_workspace_id; END IF;
  IF v_date IS DISTINCT FROM CURRENT_DATE THEN v_daily := 0; v_date := CURRENT_DATE; v_daily_refund := 0; v_durable_refund := p_amount; END IF;

  UPDATE public.credit_balances
  SET balance = v_balance + v_durable_refund, daily_balance = v_daily + v_daily_refund,
      daily_credit_date = v_date, version = v_version + 1, updated_at = now()
  WHERE workspace_id = p_workspace_id AND version = v_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'CONCURRENT_MODIFICATION: credit balance was modified concurrently'; END IF;

  INSERT INTO public.credit_transactions (workspace_id, user_id, transaction_type, amount, balance_after, job_id, description, metadata)
  VALUES (p_workspace_id, p_user_id, 'generation_refund', p_amount,
    v_balance + v_durable_refund + v_daily + v_daily_refund, p_job_id, p_description,
    jsonb_build_object('daily_refunded', v_daily_refund, 'durable_refunded', v_durable_refund))
  RETURNING id INTO v_tx_id;
  RETURN v_tx_id;
END;
$$;
