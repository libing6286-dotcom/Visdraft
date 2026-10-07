ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription
  ON public.subscriptions(payment_provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;
