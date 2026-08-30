// @credits-system — Payment API routes: checkout, subscription status, plan change, cancellation
import type { FastifyInstance, FastifyReply } from "fastify";
import type { BillingPeriod, SubscriptionPlan } from "@visdraft/shared";
import {
  subscriptionPlanSchema,
  billingPeriodSchema,
  applicationErrorResponseSchema,
  unauthenticatedErrorResponseSchema,
} from "@visdraft/shared";

import {
  PaymentServiceError,
  type PaymentService,
} from "../features/payments/payment-service.js";
import type { ViewerService } from "../features/bootstrap/ensure-user-foundation.js";
import type { RequestAuthenticator } from "../supabase/user.js";
import type { PayPalClient } from "../features/payments/paypal-client.js";
import { PLAN_CONFIGS } from "@visdraft/shared";

export async function registerPaymentRoutes(
  app: FastifyInstance,
  options: {
    auth: RequestAuthenticator;
    paymentService?: PaymentService;
    viewerService: ViewerService;
  },
) {
  // POST /api/payments/checkout — create a checkout session
  app.post("/api/payments/checkout", async (request, reply) => {
    try {
      if (!options.paymentService) return reply.code(503).send({ error: { code: "payment_not_configured", message: "Lemon Squeezy subscriptions are not configured." } });
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const body = request.body as { plan?: string; billingPeriod?: string };
      const planParsed = subscriptionPlanSchema.safeParse(body.plan);
      const periodParsed = billingPeriodSchema.safeParse(body.billingPeriod);

      if (!planParsed.success || !periodParsed.success) {
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

      const viewer = await options.viewerService.ensureViewer(user);
      const result = await options.paymentService.createCheckout(
        viewer.workspace.id,
        planParsed.data as SubscriptionPlan,
        periodParsed.data as BillingPeriod,
      );

      return reply.code(200).send({ checkoutUrl: result.checkoutUrl });
    } catch (error) {
      return sendPaymentError(error, reply, "checkout_failed");
    }
  });

  // GET /api/payments/subscription — get current subscription status
  app.get("/api/payments/subscription", async (request, reply) => {
    try {
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const viewer = await options.viewerService.ensureViewer(user);
      const status = options.paymentService
        ? await options.paymentService.getSubscriptionStatus(viewer.workspace.id)
        : { plan: "free", billingPeriod: null, status: null, lemonSqueezySubscriptionId: null, currentPeriodEnd: null, canceledAt: null, customerPortalUrl: null };

      return reply.code(200).send(status);
    } catch (error) {
      return sendPaymentError(error, reply, "subscription_not_found");
    }
  });

  // POST /api/payments/cancel — cancel subscription at period end
  app.post("/api/payments/cancel", async (request, reply) => {
    try {
      if (!options.paymentService) return reply.code(503).send({ error: { code: "payment_not_configured", message: "Lemon Squeezy subscriptions are not configured." } });
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const viewer = await options.viewerService.ensureViewer(user);
      await options.paymentService.cancelSubscription(viewer.workspace.id);

      return reply.code(200).send({ success: true });
    } catch (error) {
      return sendPaymentError(error, reply, "subscription_update_failed");
    }
  });

  // POST /api/payments/change-plan — change to a different plan
  app.post("/api/payments/change-plan", async (request, reply) => {
    try {
      if (!options.paymentService) return reply.code(503).send({ error: { code: "payment_not_configured", message: "Lemon Squeezy subscriptions are not configured." } });
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);

      const body = request.body as { plan?: string; billingPeriod?: string };
      const planParsed = subscriptionPlanSchema.safeParse(body.plan);
      const periodParsed = billingPeriodSchema.safeParse(body.billingPeriod);

      if (!planParsed.success || !periodParsed.success) {
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
      await options.paymentService.changePlan(
        viewer.workspace.id,
        planParsed.data as SubscriptionPlan,
        periodParsed.data as BillingPeriod,
      );

      return reply.code(200).send({ success: true });
    } catch (error) {
      return sendPaymentError(error, reply, "subscription_update_failed");
    }
  });
}

export async function registerPayPalRoutes(app: FastifyInstance, options: { auth: RequestAuthenticator; paypal: PayPalClient; viewerService: ViewerService; getAdminClient: any; currency: string; webOrigin: string }) {
  app.post("/api/payments/paypal/create-order", async (request, reply) => {
    try {
      const user = await options.auth.authenticate(request);
      if (!user) return sendUnauthenticated(reply);
      const body = request.body as { plan?: string; billingPeriod?: string };
      const plan = body.plan as keyof typeof PLAN_CONFIGS;
      const period = body.billingPeriod === "yearly" ? "yearly" : body.billingPeriod === "monthly" ? "monthly" : null;
      if (!period || !plan || plan === "free" || !PLAN_CONFIGS[plan]) return reply.code(400).send({ error: { code: "invalid_request", message: "Invalid plan or billing period." } });
      const viewer = await options.viewerService.ensureViewer(user);
      // PayPal single-purchase checkout charges the displayed monthly amount,
      // including when the pricing toggle is set to yearly. Lemon Squeezy keeps
      // its separate annual subscription pricing unchanged.
      const amount = PLAN_CONFIGS[plan].monthlyPrice.toFixed(2);
      const customId = `${viewer.workspace.id}:${plan}:${period}`;
      const order = await options.paypal.createOrder({ amount, currency: options.currency, customId, returnUrl: `${options.webOrigin}/pricing?paypal=success`, cancelUrl: `${options.webOrigin}/pricing?paypal=cancelled` });
      const { error } = await options.getAdminClient().from("paypal_orders").upsert({ paypal_order_id: order.id, workspace_id: viewer.workspace.id, plan, billing_period: period, amount, currency: options.currency }, { onConflict: "paypal_order_id", ignoreDuplicates: true });
      if (error) throw new Error(`Failed to save PayPal order: ${error.message}`);
      return reply.send({ orderId: order.id, approveUrl: order.approveUrl });
    } catch (error) {
      console.error("[PayPal] Create order failed:", error);
      return reply.code(502).send({ error: { code: "paypal_order_failed", message: error instanceof Error ? error.message : "PayPal order creation failed." } });
    }
  });

  app.post("/api/payments/paypal/capture-order", async (request, reply) => {
    const user = await options.auth.authenticate(request);
    if (!user) return sendUnauthenticated(reply);
    const orderId = (request.body as { orderId?: string }).orderId;
    if (!orderId) return reply.code(400).send({ error: { code: "invalid_request", message: "orderId is required." } });
    const viewer = await options.viewerService.ensureViewer(user);
    const admin = options.getAdminClient();
    const { data: row } = await admin.from("paypal_orders").select("*").eq("paypal_order_id", orderId).eq("workspace_id", viewer.workspace.id).maybeSingle();
    if (!row) return reply.code(404).send({ error: { code: "order_not_found", message: "PayPal order not found." } });
    if (row.status === "completed") return reply.send({ success: true, status: "COMPLETED" });
    const captured = await options.paypal.captureOrder(orderId);
    if (captured.status !== "COMPLETED" || captured.amount !== Number(row.amount).toFixed(2) || captured.currency !== row.currency) return reply.code(400).send({ error: { code: "payment_verification_failed", message: "PayPal payment could not be verified." } });
    const credits = PLAN_CONFIGS[row.plan as keyof typeof PLAN_CONFIGS].monthlyCredits * (row.billing_period === "yearly" ? 12 : 1);
    const { data: balance } = await admin.from("credit_balances").select("balance,version").eq("workspace_id", viewer.workspace.id).maybeSingle();
    const next = (balance?.balance ?? 0) + credits;
    if (balance) await admin.from("credit_balances").update({ balance: next, version: (balance.version ?? 0) + 1, updated_at: new Date().toISOString() }).eq("workspace_id", viewer.workspace.id);
    else await admin.from("credit_balances").insert({ workspace_id: viewer.workspace.id, balance: credits, version: 1 });
    await admin.from("credit_transactions").insert({ workspace_id: viewer.workspace.id, transaction_type: "purchase", amount: credits, balance_after: next, description: `PayPal ${row.plan} ${row.billing_period} purchase` });
    await admin.from("paypal_orders").update({ status: "completed", processed_at: new Date().toISOString() }).eq("paypal_order_id", orderId);
    return reply.send({ success: true, status: captured.status, credits });
  });
}

// ── Helpers ──────────────────────────────────────────────────

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
