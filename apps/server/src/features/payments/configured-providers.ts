import type { ServerEnv } from "../../config/env.js";
import { CreemProvider } from "./creem-provider.js";
import { PayPalProvider } from "./paypal-provider.js";
import { PaymentManager } from "./payment-manager.js";
import { StripeProvider } from "./stripe-provider.js";
import { WaffoProvider } from "./waffo-provider.js";

export function createConfiguredPaymentManager(env: ServerEnv): PaymentManager {
  const manager = new PaymentManager(env.paymentDefaultProvider);
  if (env.stripeSecretKey) manager.add(new StripeProvider(env.stripeSecretKey, env.stripeWebhookSecret));
  if (env.creemApiKey) manager.add(new CreemProvider(env.creemApiKey, env.creemWebhookSecret));
  if (env.paypalClientId && env.paypalClientSecret) manager.add(new PayPalProvider({ clientId: env.paypalClientId, clientSecret: env.paypalClientSecret, ...(env.paypalEnvironment ? { environment: env.paypalEnvironment } : {}), ...(env.paypalCurrency ? { currency: env.paypalCurrency } : {}), ...(env.paypalWebhookId ? { webhookId: env.paypalWebhookId } : {}) }));
  if (env.waffoMerchantId && env.waffoPrivateKey) manager.add(new WaffoProvider({ merchantId: env.waffoMerchantId, privateKey: env.waffoPrivateKey, ...(env.waffoEnvironment ? { environment: env.waffoEnvironment } : {}), ...(env.waffoProducts ? { products: env.waffoProducts } : {}), ...(env.waffoWebhookPublicKey ? { webhookPublicKey: env.waffoWebhookPublicKey } : {}) }));
  return manager;
}
