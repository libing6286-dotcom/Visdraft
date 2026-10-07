export class PaymentServiceError extends Error {
  readonly statusCode: number;
  readonly code: "payment_not_configured" | "checkout_failed" | "subscription_not_found" | "subscription_update_failed" | "webhook_processing_failed";

  constructor(code: PaymentServiceError["code"], message: string, statusCode: number) {
    super(message);
    this.name = "PaymentServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

