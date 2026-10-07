ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event
  ON public.payment_events(provider, provider_event_id)
  WHERE provider IS NOT NULL AND provider_event_id IS NOT NULL;

