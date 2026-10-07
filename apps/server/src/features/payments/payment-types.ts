export type PaymentProviderName = "stripe" | "creem" | "paypal" | "waffo" | "alipay" | "wechat";

export type PaymentOrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentEventType =
  | "checkout.success"
  | "payment.success"
  | "payment.failed"
  | "payment.refunded"
  | "subscribe.updated"
  | "subscribe.canceled";

export type PaymentCheckoutInput = {
  orderNo: string;
  workspaceId: string;
  productId: string;
  plan: string;
  billingPeriod: "monthly" | "yearly" | "lifetime";
  paymentType: "subscription" | "one-time";
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

export type PaymentSession = {
  provider: PaymentProviderName;
  providerSessionId: string;
  checkoutUrl?: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  providerTransactionId?: string;
  providerSubscriptionId?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
};

export type PaymentEvent = {
  provider: PaymentProviderName;
  id: string;
  type: PaymentEventType;
  session: PaymentSession;
  raw: unknown;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: PaymentCheckoutInput): Promise<PaymentSession>;
  getPaymentSession(sessionId: string): Promise<PaymentSession>;
  parseWebhook(request: Request): Promise<PaymentEvent>;
  cancelSubscription?(subscriptionId: string): Promise<void>;
  changeSubscription?(subscriptionId: string, input: { productId: string; plan: string; billingPeriod: "monthly" | "yearly" }): Promise<unknown>;
}
