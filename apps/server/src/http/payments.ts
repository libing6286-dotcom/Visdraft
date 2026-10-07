// @credits-system 鈥?Payment API routes: checkout, subscription status, plan change, cancellation
import type { FastifyInstance, FastifyReply } from "fastify";
import type { BillingPeriod, SubscriptionPlan } from "@visdraft/shared";
import {
  subscriptionPlanSchema,
  billingPeriodSchema,
  applicationErrorResponseSchema,
  unauthenticatedErrorResponseSchema,
} from "@visdraft/shared";

import { PaymentServiceError } from "../features/payments/payment-errors.js";
import type { ViewerService } from "../features/bootstrap/ensure-user-foundation.js";
import type { RequestAuthenticator } from "../supabase/user.js";
import { PLAN_CONFIGS } from "@visdraft/shared";
import type { PaymentManager } from "../features/payments/payment-manager.js";
import { createPaymentOrder, attachCheckoutSession } from "../features/payments/unified-payment-service.js";
import { randomUUID } from "node:crypto";

export async function registerPaymentRoutes(
  app: FastifyInstance,
  options: {
    auth: RequestAuthenticator;
    paymentManager?: PaymentManager;
    getAdminClient?: any;
    webOrigin?: string;
    viewerService: ViewerService;
  },
) {
  // POST /api/payments/checkout 鈥?create a checkout session
  app.post("/api/payments/checkout", async (request, reply) => {
    try {
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);
      const viewer = await options.viewerService.ensureViewer(user);
      if (options.paymentManager && options.getAdminClient) {
        const body = request.body as { plan?: string; billingPeriod?: string; provider?: string };
        const planParsed = subscriptionPlanSchema.safeParse(body.plan);
        const periodParsed = billingPeriodSchema.safeParse(body.billingPeriod);
        if (!planParsed.success || !periodParsed.success || planParsed.data === "free") return reply.code(400).send({ error: { code: "invalid_request", message: "Invalid paid plan or billing period." } });
        const plan = planParsed.data as SubscriptionPlan;
        const period = periodParsed.data as BillingPeriod;
        const config = PLAN_CONFIGS[plan];
        const paymentType = period === "lifetime" ? "one-time" : "subscription";
        const amount = Math.round((period === "lifetime" ? (plan === "starter" ? 149 : plan === "pro" ? 499 : 1999) : period === "yearly" ? (plan === "starter" ? 86 : plan === "pro" ? 278 : 950) : config.monthlyPrice) * 100);
        const orderNo = `ord_${randomUUID()}`;
        const provider = options.paymentManager.get(body.provider as any);
        if (!provider) return reply.code(503).send({ error: { code: "payment_not_configured", message: "No payment provider configured." } });
        const productId = `${plan}_${period}`;
        const providerProductId = provider.name === "waffo" ? (provider as any).configuredProductId(productId) : productId;
        if (provider.name === "waffo" && !providerProductId) return reply.code(503).send({ error: { code: "payment_not_configured", message: `Waffo product is not configured for ${productId}.` } });
        await createPaymentOrder(options.getAdminClient(), { orderNo, workspaceId: viewer.workspace.id, userId: user.id, provider: provider.name, productId: providerProductId ?? productId, plan, billingPeriod: period, paymentType, amount, currency: "usd" });
        const session = await provider.createCheckout({ orderNo, workspaceId: viewer.workspace.id, productId, plan, billingPeriod: period, paymentType, amount, currency: "usd", successUrl: `${options.webOrigin ?? "http://localhost:3000"}/pricing?payment=success&order_no=${orderNo}`, cancelUrl: `${options.webOrigin ?? "http://localhost:3000"}/pricing?payment=cancelled`, customerEmail: user.email });
        await attachCheckoutSession(options.getAdminClient(), orderNo, session.providerSessionId, session.raw ?? {});
        return reply.code(200).send({ checkoutUrl: session.checkoutUrl, orderNo, provider: provider.name });
      }
      if (!options.paymentManager || !options.getAdminClient) return reply.code(503).send({ error: { code: "payment_not_configured", message: "Payment service is not configured." } });

      const body = request.body as { plan?: string; billingPeriod?: string };
      const planParsed = subscriptionPlanSchema.safeParse(body.plan);
      const periodParsed = billingPeriodSchema.safeParse(body.billingPeriod);

      if (!planParsed.success || !periodParsed.success || periodParsed.data === "lifetime") {
        return reply.code(400).send(
          applicationErrorResponseSchema.parse({
            error: {
              code: "invalid_request",
              message:
                "Invalid request. `plan` must be one of starter/pro/ultra/business and `billingPeriod` must be monthly/yearly.",
            },
          }),
        );
      }

      if (planParsed.data === "free") {
        return reply.code(400).send(
          applicationErrorResponseSchema.parse({
            error: {
              code: "invalid_request",
              message: "Cannot create a checkout for the free plan.",
            },
          }),
        );
      }

      return reply.code(503).send({ error: { code: "payment_not_configured", message: "Payment service is not configured." } });
    } catch (error) {
      return sendPaymentError(error, reply, "checkout_failed");
    }
  });

  // GET /api/payments/subscription 鈥?get current subscription status
  app.get("/api/payments/subscription", async (request, reply) => {
    try {
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const viewer = await options.viewerService.ensureViewer(user);
      const admin = options.getAdminClient?.();
      const { data } = admin ? await admin.from("subscriptions").select("plan, billing_period, payment_provider, provider_subscription_id, current_period_end, canceled_at").eq("workspace_id", viewer.workspace.id).maybeSingle() : { data: null };
      const status = { plan: data?.plan ?? "free", billingPeriod: data?.billing_period ?? null, status: data?.provider_subscription_id || (data?.plan && data.plan !== "free") ? "active" : null, provider: data?.payment_provider ?? null, providerSubscriptionId: data?.provider_subscription_id ?? null, currentPeriodEnd: data?.current_period_end ?? null, canceledAt: data?.canceled_at ?? null };

      return reply.code(200).send(status);
    } catch (error) {
      return sendPaymentError(error, reply, "subscription_not_found");
    }
  });

  // POST /api/payments/cancel 鈥?cancel subscription at period end
  app.post("/api/payments/cancel", async (request, reply) => {
    try {
      if (!options.paymentManager) return reply.code(503).send({ error: { code: "payment_not_configured", message: "Payment service is not configured." } });
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const viewer = await options.viewerService.ensureViewer(user);
      const admin = options.getAdminClient?.();
      const { data: subscription } = admin ? await admin.from("subscriptions").select("payment_provider, provider_subscription_id").eq("workspace_id", viewer.workspace.id).maybeSingle() : { data: null };
      if (!subscription?.payment_provider || !subscription.provider_subscription_id) return reply.code(404).send({ error: { code: "subscription_not_found", message: "No active provider subscription found." } });
      await options.paymentManager.cancel(subscription.payment_provider, subscription.provider_subscription_id);
      await admin.from("subscriptions").update({ canceled_at: new Date().toISOString(), status: "pending_cancel", updated_at: new Date().toISOString() }).eq("workspace_id", viewer.workspace.id);
      return reply.code(200).send({ success: true });
    } catch (error) {
      return sendPaymentError(error, reply, "subscription_update_failed");
    }
  });

  // POST /api/payments/change-plan 鈥?change to a different plan
  app.post("/api/payments/change-plan", async (request, reply) => {
    try {
      if (!options.paymentManager) return reply.code(503).send({ error: { code: "payment_not_configured", message: "Payment service is not configured." } });
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const body = request.body as { plan?: string; billingPeriod?: string };
      const planParsed = subscriptionPlanSchema.safeParse(body.plan);
      const periodParsed = billingPeriodSchema.safeParse(body.billingPeriod);

      if (!planParsed.success || !periodParsed.success || periodParsed.data === "lifetime") {
        return reply.code(400).send(
          applicationErrorResponseSchema.parse({
            error: {
              code: "invalid_request",
              message:
                "Invalid request. `plan` must be one of starter/pro/ultra/business and `billingPeriod` must be monthly/yearly.",
            },
          }),
        );
      }

      if (planParsed.data === "free") {
        return reply.code(400).send(
          applicationErrorResponseSchema.parse({
            error: {
              code: "invalid_request",
              message:
                "Cannot change to the free plan. Use cancel instead.",
            },
          }),
        );
      }

      const viewer = await options.viewerService.ensureViewer(user);
      const admin = options.getAdminClient?.();
      const { data: subscription } = admin ? await admin.from("subscriptions").select("payment_provider, provider_subscription_id").eq("workspace_id", viewer.workspace.id).maybeSingle() : { data: null };
      if (!subscription?.payment_provider || !subscription.provider_subscription_id) return reply.code(404).send({ error: { code: "subscription_not_found", message: "No active provider subscription found." } });
      const result = await options.paymentManager.change(subscription.payment_provider, subscription.provider_subscription_id, { productId: `${planParsed.data}_${periodParsed.data}`, plan: planParsed.data, billingPeriod: periodParsed.data });
      return reply.code(200).send({ success: true, ...(result && typeof result === "object" && "checkoutUrl" in result ? { checkoutUrl: result.checkoutUrl } : {}) });
    } catch (error) {
      return sendPaymentError(error, reply, "subscription_update_failed");
    }
  });
}

// 鈹€鈹€ Helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function sendUnauthenticated(reply: FastifyReply) {
  return reply.code(401).send(
    unauthenticatedErrorResponseSchema.parse({
      error: {
        code: "unauthorized",
        message: "Missing or invalid bearer token.",
      },
    }),
  );
}

type PaymentErrorFallbackCode =
  | "checkout_failed"
  | "subscription_not_found"
  | "subscription_update_failed";

function sendPaymentError(
  error: unknown,
  reply: FastifyReply,
  fallbackCode: PaymentErrorFallbackCode,
) {
  if (error instanceof PaymentServiceError) {
    return reply.code(error.statusCode).send(
      applicationErrorResponseSchema.parse({
        error: { code: error.code, message: error.message },
      }),
    );
  }
  console.error("[PaymentRoutes] Unexpected error:", error);
  return reply.code(500).send(
    applicationErrorResponseSchema.parse({
      error: {
        code: fallbackCode,
        message: "An unexpected error occurred.",
      },
    }),
  );
}
