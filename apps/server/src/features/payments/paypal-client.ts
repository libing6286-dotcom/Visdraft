import { request } from "undici";
import { randomUUID } from "node:crypto";

export type PayPalClient = {
  createOrder(input: { amount: string; currency: string; customId: string; returnUrl: string; cancelUrl: string }): Promise<{ id: string; approveUrl: string }>;
  captureOrder(orderId: string): Promise<{ id: string; status: string; amount: string; currency: string; customId?: string | undefined }>;
  verifyWebhook(input: { event: unknown; headers: Record<string, string>; webhookId: string }): Promise<boolean>;
};

export function createPayPalClient(options: { clientId: string; clientSecret: string; environment?: string; webhookId?: string }): PayPalClient {
  const base = options.environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const checkoutBase = options.environment === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com";
  let token: { value: string; expiresAt: number } | null = null;
  async function accessToken() {
    if (token && token.expiresAt > Date.now() + 30_000) return token.value;
    const auth = Buffer.from(`${options.clientId}:${options.clientSecret}`).toString("base64");
    const response = await request(`${base}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
    if (response.statusCode >= 400) throw new Error(`PayPal OAuth failed (${response.statusCode})`);
    const body = (await response.body.json()) as { access_token: string; expires_in: number };
    token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return token.value;
  }
  return {
    async createOrder(input) {
      const response = await request(`${base}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", "PayPal-Request-Id": `visdraft-${randomUUID()}` }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ custom_id: input.customId, amount: { currency_code: input.currency, value: input.amount } }], application_context: { return_url: input.returnUrl, cancel_url: input.cancelUrl, user_action: "PAY_NOW" } }) });
      const body = (await response.body.json()) as any;
      if (response.statusCode >= 400) throw new Error(body?.message ?? `PayPal create order failed (${response.statusCode})`);
      // PayPal may return `payer-action` for newer Checkout responses and
      // `approve` for older responses.
      const approve = body.links?.find((link: any) => link.rel === "payer-action" || link.rel === "approve")?.href
        ?? (body.id ? `${checkoutBase}/checkoutnow?token=${encodeURIComponent(body.id)}` : undefined);
      if (!approve) throw new Error("PayPal approval link missing");
      return { id: body.id as string, approveUrl: approve as string };
    },
    async captureOrder(orderId) {
      const response = await request(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", "PayPal-Request-Id": `visdraft-capture-${orderId}` }, body: "{}" });
      const body = (await response.body.json()) as any;
      if (response.statusCode >= 400) throw new Error(body?.message ?? `PayPal capture failed (${response.statusCode})`);
      const unit = body.purchase_units?.[0];
      const capture = unit?.payments?.captures?.[0];
      return { id: body.id as string, status: body.status as string, amount: capture?.amount?.value as string, currency: capture?.amount?.currency_code as string, customId: unit?.custom_id as string | undefined };
    },
    async verifyWebhook(input) {
      const response = await request(`${base}/v1/notifications/verify-webhook-signature`, { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ auth_algo: input.headers["paypal-auth-algo"], cert_url: input.headers["paypal-cert-url"], transmission_id: input.headers["paypal-transmission-id"], transmission_sig: input.headers["paypal-transmission-sig"], transmission_time: input.headers["paypal-transmission-time"], webhook_id: input.webhookId, webhook_event: input.event }) });
      const body = await response.body.json() as { verification_status?: string };
      return response.statusCode < 400 && body.verification_status === "SUCCESS";
    },
  };
}
