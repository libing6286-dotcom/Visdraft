-- Unified provider-neutral payment orders.
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('stripe', 'creem', 'paypal', 'alipay', 'wechat')),
  provider_session_id text,
  provider_transaction_id text,
  provider_subscription_id text,
  product_id text NOT NULL,
  plan public.subscription_plan,
  billing_period text,
  payment_type text NOT NULL CHECK (payment_type IN ('subscription', 'one-time')),
  amount integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'created',
  checkout_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_result jsonb,
  error_message text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_workspace
  ON public.payment_orders(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_session
  ON public.payment_orders(provider, provider_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_provider_transaction
  ON public.payment_orders(provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own workspace payment orders"
  ON public.payment_orders FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

