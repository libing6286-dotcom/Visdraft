CREATE TABLE IF NOT EXISTS public.paypal_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_order_id text NOT NULL UNIQUE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan text NOT NULL,
  billing_period text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'created',
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_workspace ON public.paypal_orders(workspace_id, created_at DESC);
ALTER TABLE public.paypal_orders ENABLE ROW LEVEL SECURITY;
