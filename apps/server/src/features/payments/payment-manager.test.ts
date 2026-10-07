import { describe, expect, it } from "vitest";
import { PaymentManager } from "./payment-manager.js";
import type { PaymentProvider } from "./payment-types.js";
import { extractPaymentOrderIdentifiers } from "./unified-payment-service.js";
import { WaffoProvider } from "./waffo-provider.js";

const provider = (name: PaymentProvider["name"]) => ({ name }) as PaymentProvider;

describe("PaymentManager", () => {
  it("selects the configured default provider", () => {
    const manager = new PaymentManager("creem");
    manager.add(provider("stripe"));
    manager.add(provider("creem"));
    expect(manager.get()?.name).toBe("creem");
  });

  it("rejects an explicitly unavailable provider", () => {
    const manager = new PaymentManager();
    expect(() => manager.get("paypal")).toThrow("not configured");
  });

  it("extracts Lifetime order numbers from provider webhook metadata", () => {
    const identifiers = extractPaymentOrderIdentifiers({
      provider: "stripe",
      id: "evt_lifetime",
      type: "checkout.success",
      session: {
        provider: "stripe",
        providerSessionId: "cs_lifetime",
        providerTransactionId: "pi_lifetime",
        status: "paid",
      },
      raw: { data: { object: { metadata: { order_no: "ord_lifetime" } } } },
    });

    expect(identifiers).toEqual({
      providerSessionId: "cs_lifetime",
      providerTransactionId: "pi_lifetime",
      orderNo: "ord_lifetime",
    });
  });

  it("extracts PayPal order numbers from custom_id", () => {
    const identifiers = extractPaymentOrderIdentifiers({
      provider: "paypal",
      id: "evt_paypal",
      type: "payment.success",
      session: { provider: "paypal", providerSessionId: "order_paypal", status: "paid" },
      raw: { resource: { purchase_units: [{ custom_id: "workspace:ord_lifetime" }] } },
    });

    expect(identifiers.orderNo).toBe("ord_lifetime");
  });

  it("maps Waffo checkout and signed webhook events into payment events", async () => {
    let sentProductId = "";
    const waffo = new WaffoProvider({
      merchantId: "MER_test",
      privateKey: "not-used-by-mocked-client",
      environment: "test",
      products: { pro_monthly: "PROD_monthly" },
      client: {
        checkout: { createSession: async (params: any, options: any) => {
          sentProductId = params.productId;
          expect(params).toMatchObject({ productId: "PROD_monthly", currency: "USD", metadata: { order_no: "ord_1", workspace_id: "ws_1" }, orderMerchantExternalId: "ord_1" });
          expect(options).toEqual({ idempotencyKey: "ord_1" });
          return { sessionId: "ses_1", checkoutUrl: "https://checkout.example/session", expiresAt: "later" };
        }, createPlanChangeSession: async (params: any) => {
          expect(params).toMatchObject({ originOrderId: "ORD_1", productId: "PROD_monthly", currency: "USD" });
          return { sessionId: "ses_change", checkoutUrl: "https://checkout.example/change", expiresAt: "later" };
        } },
        webhooks: { verify: (raw: string, signature: string | null, options: any) => {
          expect(raw).toContain('"eventType":');
          expect(signature).toBe("signed");
          expect(options).toEqual({ environment: "test" });
          const payload = JSON.parse(raw);
          return { id: "evt_1", eventType: payload.eventType, data: { orderId: "ORD_1", paymentId: "PAY_1", orderMerchantExternalId: "ord_1" } };
        } },
      orders: { cancelSubscription: async ({ orderId }: any) => expect(orderId).toBe("ORD_1") },
      } as any,
    });
    const checkout = await waffo.createCheckout({ orderNo: "ord_1", workspaceId: "ws_1", productId: "pro_monthly", plan: "pro", billingPeriod: "monthly", paymentType: "subscription", amount: 1000, currency: "usd", successUrl: "https://app.example/success", cancelUrl: "https://app.example/cancel" });
    expect(sentProductId).toBe("PROD_monthly");
    expect(checkout.providerSessionId).toBe("ses_1");
    expect(checkout.checkoutUrl).toBe("https://checkout.example/session");
    await expect(waffo.changeSubscription("ORD_1", { productId: "pro_monthly", plan: "pro", billingPeriod: "monthly" })).resolves.toEqual({ checkoutUrl: "https://checkout.example/change" });

    const event = await waffo.parseWebhook(new Request("https://api.example", { method: "POST", headers: { "x-waffo-signature": "signed" }, body: JSON.stringify({ eventType: "subscription.activated" }) }));
    expect(event).toMatchObject({ provider: "waffo", id: "evt_1", type: "checkout.success", session: { providerSessionId: "ord_1", providerTransactionId: "PAY_1", providerSubscriptionId: "ORD_1", status: "paid" } });
    expect(extractPaymentOrderIdentifiers(event).orderNo).toBe("ord_1");

    const renewal = await waffo.parseWebhook(new Request("https://api.example", { method: "POST", headers: { "x-waffo-signature": "signed" }, body: JSON.stringify({ eventType: "subscription.payment_succeeded" }) }));
    expect(renewal.type).toBe("payment.success");
    expect(renewal.session.providerSessionId).toBe("PAY_1");
    expect(extractPaymentOrderIdentifiers(renewal).orderNo).toBeUndefined();
  });
});
