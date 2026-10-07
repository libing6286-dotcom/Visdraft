import { WaffoPancake, type WebhookEventData, type WaffoPancakeConfig } from "@waffo/pancake-ts";
import type { PaymentCheckoutInput, PaymentEvent, PaymentProvider, PaymentSession } from "./payment-types.js";

type WaffoClient = Pick<WaffoPancake, "checkout" | "orders" | "webhooks">;
type WaffoProductKey = "starter_monthly" | "starter_yearly" | "starter_lifetime" | "pro_monthly" | "pro_yearly" | "pro_lifetime" | "ultra_monthly" | "ultra_yearly" | "ultra_lifetime" | "business_monthly" | "business_yearly" | "business_lifetime";

export class WaffoProvider implements PaymentProvider {
  readonly name = "waffo" as const;
  private readonly client: WaffoClient;

  constructor(private readonly options: {
    merchantId: string;
    privateKey: string;
    environment?: "test" | "prod";
    products?: Partial<Record<WaffoProductKey, string>>;
    webhookPublicKey?: string;
    client?: WaffoClient;
  }) {
    this.client = options.client ?? new WaffoPancake({ merchantId: options.merchantId, privateKey: options.privateKey, ...(options.webhookPublicKey ? { webhookPublicKey: options.webhookPublicKey } : {}) } satisfies WaffoPancakeConfig);
  }

  configuredProductId(key: string) {
    return this.options.products?.[key as WaffoProductKey];
  }

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentSession> {
    const productId = this.options.products?.[input.productId as WaffoProductKey];
    if (!productId) throw new Error(`Waffo product ID is not configured for ${input.productId}`);
    const session = await this.client.checkout.createSession({
      productId,
      currency: input.currency.toUpperCase(),
      successUrl: input.successUrl,
      orderMerchantExternalId: input.orderNo,
      metadata: { order_no: input.orderNo, workspace_id: input.workspaceId, plan: input.plan, billing_period: input.billingPeriod },
      ...(input.customerEmail ? { buyerEmail: input.customerEmail } : {}),
    }, { idempotencyKey: input.orderNo });
    return { provider: this.name, providerSessionId: session.sessionId, checkoutUrl: session.checkoutUrl, status: "pending", raw: session };
  }

  async getPaymentSession(sessionId: string): Promise<PaymentSession> {
    return { provider: this.name, providerSessionId: sessionId, status: "pending" };
  }

  async parseWebhook(request: Request): Promise<PaymentEvent> {
    const raw = await request.text();
    const event = this.client.webhooks.verify(raw, request.headers.get("x-waffo-signature"), { environment: this.options.environment ?? "test" });
    const data = event.data as unknown as WebhookEventData;
    const mapped = mapWaffoEventType(event.eventType);
    const orderNo = mapped === "checkout.success" ? data.orderMerchantExternalId ?? data.orderMetadata?.order_no : undefined;
    const object = { ...data, metadata: { ...data.orderMetadata, ...(orderNo ? { order_no: orderNo } : {}) }, orderMerchantExternalId: orderNo };
    const amount = parseAmount(data.chargedAmount ?? data.amount);
    return {
      provider: this.name,
      id: event.id,
      type: mapped,
      session: {
        provider: this.name,
        providerSessionId: mapped === "payment.success" ? data.paymentId ?? data.orderId : orderNo ?? data.orderId,
        status: mapped === "payment.failed" ? "failed" : mapped === "payment.refunded" ? "cancelled" : mapped === "payment.success" || mapped === "checkout.success" ? "paid" : "pending",
        currency: data.currency,
        raw: data,
        ...(data.paymentId ? { providerTransactionId: data.paymentId } : {}),
        ...(event.eventType.startsWith("subscription.") ? { providerSubscriptionId: data.orderId } : {}),
        ...(amount !== undefined ? { amount } : {}),
      },
      raw: { ...event, data: { object } },
    };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.client.orders.cancelSubscription({ orderId: subscriptionId });
  }

  async changeSubscription(subscriptionId: string, input: { productId: string; plan: string; billingPeriod: "monthly" | "yearly" }) {
    const productId = this.configuredProductId(input.productId);
    if (!productId) throw new Error(`Waffo product ID is not configured for ${input.productId}`);
    const session = await this.client.checkout.createPlanChangeSession({
      originOrderId: subscriptionId,
      productId,
      currency: "USD",
      metadata: { plan: input.plan, billing_period: input.billingPeriod },
    });
    return { checkoutUrl: session.checkoutUrl };
  }
}

function mapWaffoEventType(eventType: string): PaymentEvent["type"] {
  if (eventType === "order.completed" || eventType === "subscription.activated") return "checkout.success";
  if (eventType === "subscription.payment_succeeded" || eventType === "subscription.renewed" || eventType === "subscription.recovered") return "payment.success";
  if (eventType === "subscription.canceling") return "subscribe.updated";
  if (eventType === "subscription.canceled") return "subscribe.canceled";
  if (eventType === "subscription.past_due" || eventType === "subscription.plan_change_failed" || eventType === "refund.failed") return "payment.failed";
  if (eventType === "refund.succeeded") return "payment.refunded";
  return "subscribe.updated";
}

function parseAmount(amount?: string) {
  if (!amount) return undefined;
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * 100) : undefined;
}
