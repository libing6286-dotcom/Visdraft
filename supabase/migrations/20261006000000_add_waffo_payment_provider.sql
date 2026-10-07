ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_provider_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_provider_check
  CHECK (provider IN ('stripe', 'creem', 'paypal', 'waffo', 'alipay', 'wechat'));
