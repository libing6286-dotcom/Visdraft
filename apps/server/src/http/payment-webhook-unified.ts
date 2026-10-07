import type { FastifyInstance } from "fastify";
import type { AdminSupabaseClient } from "../supabase/admin.js";
import { createConfiguredPaymentManager } from "../features/payments/configured-providers.js";
import type { ServerEnv } from "../config/env.js";
import type { PaymentProviderName } from "../features/payments/payment-types.js";
import { processPaymentEvent } from "../features/payments/unified-payment-service.js";

export async function registerUnifiedPaymentWebhookRoute(app: FastifyInstance, options: { env: ServerEnv; getAdminClient: () => AdminSupabaseClient }) {
  await app.register(async (scope) => {
    scope.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => done(null, body));
    scope.post<{ Params: { provider: string } }>("/api/payments/webhook/:provider", async (request, reply) => {
    const provider = request.params.provider as PaymentProviderName;
    const manager = createConfiguredPaymentManager(options.env);
    const implementation = manager.get(provider);
    if (!implementation) return reply.code(503).send({ error: "No payment provider configured" });
    try {
      const body = typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (typeof value === "string") headers.set(key, value);
      }
      const event = await implementation.parseWebhook(new Request("http://payment-webhook.local", { method: "POST", headers, body }));
      const admin = options.getAdminClient();
      const { data: audit, error } = await (admin as any).from("payment_events").insert({
        event_name: `${event.provider}.${event.type}`,
        provider: event.provider,
        provider_event_id: event.id,
        payload: event.raw,
        processed: false,
      });
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
      if (error) {
        const { data: existing } = await (admin as any).from("payment_events").select("processed").eq("provider", event.provider).eq("provider_event_id", event.id).maybeSingle();
        if (existing?.processed) return reply.code(200).send({ received: true, eventId: event.id, duplicate: true });
      }
      await processPaymentEvent(admin, event);
      if (audit?.id) await (admin as any).from("payment_events").update({ processed: true }).eq("id", audit.id);
      else await (admin as any).from("payment_events").update({ processed: true }).eq("provider", event.provider).eq("provider_event_id", event.id);
      return reply.code(200).send({ received: true, eventId: event.id });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : "";
      const statusCode = /signature|invalid .*webhook|not configured/i.test(message) ? 400 : 500;
      return reply.code(statusCode).send({ error: statusCode === 400 ? "Invalid payment webhook" : "Payment webhook processing failed" });
    }
    });
  });
}
