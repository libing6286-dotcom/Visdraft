import { createPayPalClient, type PayPalClient } from "./paypal-client.js";
import type { PaymentCheckoutInput, PaymentEvent, PaymentProvider, PaymentSession } from "./payment-types.js";

export class PayPalProvider implements PaymentProvider {
  readonly name = "paypal" as const;
  private readonly client: PayPalClient;
  constructor(options: { clientId: string; clientSecret: string; environment?: string; currency?: string; webhookId?: string }) {
    this.client = createPayPalClient(options);
    this.currency = options.currency ?? "USD";
    this.webhookId = options.webhookId;
  }
  private readonly currency: string;
  private readonly webhookId: string | undefined;

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentSession> {
    const order = await this.client.createOrder({ amount: (input.amount / 100).toFixed(2), currency: this.currency, customId: `${input.workspaceId}:${input.orderNo}`, returnUrl: input.successUrl, cancelUrl: input.cancelUrl });
    return { provider: this.name, providerSessionId: order.id, checkoutUrl: order.approveUrl, status: "pending", raw: order };
  }

  async getPaymentSession(sessionId: string): Promise<PaymentSession> {
    const result = await this.client.captureOrder(sessionId);
    return { provider: this.name, providerSessionId: result.id, providerTransactionId: result.id, status: result.status === "COMPLETED" ? "paid" : "pending", amount: Number(result.amount) * 100, currency: result.currency, raw: result };
  }

  async parseWebhook(request: Request): Promise<PaymentEvent> {
    const raw = await request.text();
    const event = JSON.parse(raw) as any;
    if (!this.webhookId) throw new Error("PAYPAL_WEBHOOK_ID is not configured");
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });
    if (!(await this.client.verifyWebhook({ event, headers, webhookId: this.webhookId }))) throw new Error("Invalid PayPal webhook signature");
    const name = String(event.event_type ?? "");
    const type = name === "CHECKOUT.ORDER.COMPLETED" || name === "PAYMENT.CAPTURE.COMPLETED" ? "payment.success" : name.includes("SUBSCRIPTION") && name.includes("CANCEL") ? "subscribe.canceled" : name.includes("SUBSCRIPTION") ? "subscribe.updated" : "payment.failed";
    const resource = event.resource ?? {};
    const orderId = resource.supplementary_data?.related_ids?.order_id ?? resource.id;
    return { provider: this.name, id: String(event.id), type, session: { provider: this.name, providerSessionId: String(orderId ?? ""), providerTransactionId: resource.id, providerSubscriptionId: resource.billing_agreement_id ?? resource.subscription_id, status: type === "payment.success" ? "paid" : type === "subscribe.canceled" ? "cancelled" : "pending", amount: Number(resource.amount?.value ?? resource.seller_receivable_breakdown?.gross_amount?.value ?? 0) * 100, currency: resource.amount?.currency_code ?? resource.seller_receivable_breakdown?.gross_amount?.currency_code, raw: resource }, raw: event };
  }
}
