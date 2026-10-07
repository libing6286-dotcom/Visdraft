import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentCheckoutInput, PaymentEvent, PaymentProvider, PaymentSession } from "./payment-types.js";

export class CreemProvider implements PaymentProvider {
  readonly name = "creem" as const;
  private readonly baseUrl: string;

  constructor(private readonly apiKey: string, private readonly signingSecret?: string, environment: "sandbox" | "production" = "sandbox") {
    this.baseUrl = environment === "production" ? "https://api.creem.io" : "https://test-api.creem.io";
  }

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentSession> {
    const result = await this.request("/v1/checkouts", "POST", {
      product_id: input.productId,
      request_id: input.orderNo,
      success_url: input.successUrl,
      metadata: { workspace_id: input.workspaceId, order_no: input.orderNo },
      customer: input.customerEmail ? { email: input.customerEmail } : undefined,
    });
    if (!result?.id || !result.checkout_url) throw new Error("Creem checkout creation failed");
    return { provider: this.name, providerSessionId: String(result.id), checkoutUrl: result.checkout_url, status: "pending", raw: result };
  }

  async getPaymentSession(sessionId: string): Promise<PaymentSession> {
    const result = await this.request(`/v1/checkouts?checkout_id=${encodeURIComponent(sessionId)}`, "GET");
    const status = result?.order?.status === "paid" ? "paid" : "pending";
    return { provider: this.name, providerSessionId: String(result.id ?? sessionId), providerTransactionId: result.order?.id, status, amount: result.order?.amount, currency: result.order?.currency, raw: result };
  }

  async parseWebhook(request: Request): Promise<PaymentEvent> {
    const raw = await request.text();
    const signature = request.headers.get("creem-signature");
    if (!raw || !signature || !this.signingSecret) throw new Error("Invalid Creem webhook request");
    const expected = createHmac("sha256", this.signingSecret).update(raw).digest();
    const actual = Buffer.from(signature, "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("Invalid Creem webhook signature");
    const event = JSON.parse(raw) as any;
    const type = String(event.eventType ?? "");
    const mapped = type === "checkout.completed" ? "checkout.success" : type === "subscription.paid" ? "payment.success" : type === "subscription.update" || type === "subscription.active" || type === "subscription.paused" ? "subscribe.updated" : type === "subscription.canceled" ? "subscribe.canceled" : "payment.failed";
    const object = event.object ?? {};
    return { provider: this.name, id: String(event.id ?? object.id ?? crypto.randomUUID()), type: mapped, session: { provider: this.name, providerSessionId: String(object.id ?? object.checkout_id ?? ""), providerTransactionId: object.order?.id, providerSubscriptionId: object.subscription?.id ?? object.subscription_id, status: mapped === "payment.success" || mapped === "checkout.success" ? "paid" : mapped === "subscribe.canceled" ? "cancelled" : "pending", amount: object.order?.amount, currency: object.order?.currency, raw: object }, raw: event };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.request(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, "POST", { action: "cancel" });
  }

  async changeSubscription(subscriptionId: string) {
    throw new Error(`Creem plan changes require provider product mapping for subscription ${subscriptionId}`);
  }

  private async request(path: string, method: string, body?: unknown): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { "x-api-key": this.apiKey, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Creem API request failed (${response.status})`);
    return result;
  }
}
