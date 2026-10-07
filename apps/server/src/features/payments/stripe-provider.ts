import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentCheckoutInput, PaymentEvent, PaymentProvider, PaymentSession } from "./payment-types.js";

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  constructor(private readonly secretKey: string, private readonly signingSecret?: string) {}

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentSession> {
    const params = new URLSearchParams({ mode: input.paymentType === "subscription" ? "subscription" : "payment", success_url: input.successUrl, cancel_url: input.cancelUrl, "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": input.currency, "line_items[0][price_data][unit_amount]": String(input.amount), "line_items[0][price_data][product_data][name]": input.plan, "metadata[workspace_id]": input.workspaceId, "metadata[order_no]": input.orderNo });
    if (input.paymentType === "subscription") params.set("line_items[0][price_data][recurring][interval]", input.billingPeriod === "yearly" ? "year" : "month");
    const result = await this.request("/v1/checkout/sessions", params);
    if (!result.id || !result.url) throw new Error("Stripe checkout creation failed");
    return { provider: this.name, providerSessionId: result.id, checkoutUrl: result.url, status: "pending", raw: result };
  }

  async getPaymentSession(sessionId: string): Promise<PaymentSession> {
    const result = await this.request(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
    return { provider: this.name, providerSessionId: result.id, providerTransactionId: result.payment_intent, providerSubscriptionId: result.subscription, status: result.payment_status === "paid" ? "paid" : result.status === "expired" ? "cancelled" : "pending", amount: result.amount_total, currency: result.currency, raw: result };
  }

  async parseWebhook(request: Request): Promise<PaymentEvent> {
    const raw = await request.text();
    const header = request.headers.get("stripe-signature");
    if (!raw || !header || !this.signingSecret) throw new Error("Invalid Stripe webhook request");
    const fields = Object.fromEntries(header.split(",").map((part) => part.split("=", 2)));
    const signed = `${fields.t}.${raw}`;
    const expected = createHmac("sha256", this.signingSecret).update(signed).digest("hex");
    const actual = fields.v1 ?? "";
    if (expected.length !== actual.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) throw new Error("Invalid Stripe webhook signature");
    const event = JSON.parse(raw) as any;
    const type = String(event.type);
    const mapped = type === "checkout.session.completed" ? "checkout.success" : type === "invoice.payment_succeeded" ? "payment.success" : type === "customer.subscription.updated" ? "subscribe.updated" : type === "customer.subscription.deleted" ? "subscribe.canceled" : "payment.failed";
    const object = event.data?.object ?? {};
    return { provider: this.name, id: String(event.id), type: mapped, session: { provider: this.name, providerSessionId: String(object.id ?? ""), providerTransactionId: object.payment_intent ?? object.id, providerSubscriptionId: object.subscription ?? (object.object === "subscription" ? object.id : undefined), status: mapped === "checkout.success" || mapped === "payment.success" ? "paid" : mapped === "subscribe.canceled" ? "cancelled" : "pending", amount: object.amount_total ?? object.amount_paid, currency: object.currency, raw: object }, raw: event };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.request(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, new URLSearchParams({ cancel_at_period_end: "true" }));
  }

  async changeSubscription(subscriptionId: string, input: { productId: string; plan: string; billingPeriod: "monthly" | "yearly" }) {
    void input;
    throw new Error(`Stripe plan changes require a pre-created price ID for subscription ${subscriptionId}`);
  }

  private async request(path: string, body?: URLSearchParams): Promise<any> {
    const response = await fetch(`https://api.stripe.com${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${this.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, ...(body ? { body } : {}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Stripe API request failed (${response.status})`);
    return result;
  }
}
