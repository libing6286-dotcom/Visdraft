import type { SubscriptionPlan, BillingPeriod } from "@visdraft/shared";
import { PLAN_CONFIGS } from "@visdraft/shared";
import type { AdminSupabaseClient } from "../../supabase/admin.js";
import type { PaymentEvent, PaymentOrderStatus, PaymentProviderName } from "./payment-types.js";

export async function createPaymentOrder(admin: AdminSupabaseClient, input: { orderNo: string; workspaceId: string; userId: string; provider: PaymentProviderName; productId: string; plan: SubscriptionPlan; billingPeriod: BillingPeriod; paymentType: "subscription" | "one-time"; amount: number; currency: string; checkoutInfo?: unknown }) {
  const { data, error } = await (admin as any).from("payment_orders").insert({ order_no: input.orderNo, workspace_id: input.workspaceId, user_id: input.userId, provider: input.provider, product_id: input.productId, plan: input.plan, billing_period: input.billingPeriod, payment_type: input.paymentType, amount: input.amount, currency: input.currency, checkout_info: input.checkoutInfo ?? {} }).select("*").single();
  if (error) throw new Error(`Failed to create payment order: ${error.message}`);
  return data;
}

export async function attachCheckoutSession(admin: AdminSupabaseClient, orderNo: string, providerSessionId: string, checkoutInfo: unknown) {
  const { error } = await (admin as any).from("payment_orders").update({ provider_session_id: providerSessionId, checkout_info: checkoutInfo, status: "pending", updated_at: new Date().toISOString() }).eq("order_no", orderNo);
  if (error) throw new Error(`Failed to attach payment session: ${error.message}`);
}

export async function processPaymentEvent(admin: AdminSupabaseClient, event: PaymentEvent): Promise<{ status: PaymentOrderStatus | "ignored" }> {
  const { data: existingEvent } = await (admin as any).from("payment_events").select("id, processed").eq("provider", event.provider).eq("provider_event_id", event.id).maybeSingle();
  if (existingEvent?.processed) return { status: "ignored" };
  let order = await findPaymentOrder(admin, event);
  if (!order && event.session.providerSubscriptionId) {
    const { data: subscription } = await (admin as any).from("subscriptions").select("workspace_id, plan, billing_period").eq("payment_provider", event.provider).eq("provider_subscription_id", event.session.providerSubscriptionId).maybeSingle();
    if (subscription) {
      const { data: previous } = await (admin as any).from("payment_orders").select("*").eq("workspace_id", subscription.workspace_id).eq("provider", event.provider).eq("payment_type", "subscription").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (previous) {
        const { data: renewal, error: renewalError } = await (admin as any).from("payment_orders").insert({ order_no: `renew_${event.provider}_${event.id}`, workspace_id: subscription.workspace_id, user_id: previous.user_id, provider: event.provider, provider_session_id: event.session.providerSessionId, provider_transaction_id: event.session.providerTransactionId ?? null, provider_subscription_id: event.session.providerSubscriptionId, product_id: previous.product_id, plan: subscription.plan, billing_period: subscription.billing_period, payment_type: "subscription", amount: previous.amount, currency: previous.currency, status: "pending", checkout_info: { renewal: true } }).select("*").single();
        if (renewalError && !String(renewalError.message).toLowerCase().includes("duplicate")) throw new Error(`Failed to create renewal payment order: ${renewalError.message}`);
        order = renewal;
      }
    }
  }
  if (!order) return { status: "ignored" };
  if (order.status === "paid" && event.type !== "payment.refunded") return { status: "ignored" };
  if (event.type === "payment.failed") return updateOrder(admin, order.id, "failed", event);
  if (event.type === "subscribe.canceled") {
    await (admin as any).from("subscriptions").update({ canceled_at: new Date().toISOString(), status: "canceled", updated_at: new Date().toISOString() }).eq("workspace_id", order.workspace_id).eq("payment_provider", event.provider);
    return updateOrder(admin, order.id, "cancelled", event);
  }
  if (event.type === "payment.refunded") return updateOrder(admin, order.id, "refunded", event);
  if (event.type !== "checkout.success" && event.type !== "payment.success") return { status: "ignored" };

  const nextStatus: PaymentOrderStatus = "paid";
  const { data: updated, error: updateError } = await (admin as any).from("payment_orders").update({ status: nextStatus, provider_transaction_id: event.session.providerTransactionId ?? null, provider_subscription_id: event.session.providerSubscriptionId ?? null, payment_result: event.raw, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id).in("status", ["created", "pending"]).select("id").maybeSingle();
  if (updateError) throw new Error(`Failed to mark payment order paid: ${updateError.message}`);
  if (!updated) return { status: "ignored" };

  const plan = order.plan as SubscriptionPlan;
  const config = PLAN_CONFIGS[plan];
  if (order.payment_type === "subscription") {
    await (admin as any).from("subscriptions").upsert({ workspace_id: order.workspace_id, plan, billing_period: order.billing_period, payment_provider: event.provider, provider_subscription_id: event.session.providerSubscriptionId ?? null, status: "active", current_period_end: null, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" });
  } else {
    // Lifetime purchases grant a permanent entitlement and must not retain an
    // old recurring provider subscription on the workspace.
    await (admin as any).from("subscriptions").upsert({ workspace_id: order.workspace_id, plan, billing_period: null, payment_provider: event.provider, provider_subscription_id: null, status: "active", current_period_end: null, canceled_at: null, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" });
  }
  if (config.monthlyCredits > 0) {
    const lifetimeCredits: Record<string, number> = { starter: 100000, pro: 1000000, business: 10000000 };
    const credits = order.billing_period === "lifetime" ? (lifetimeCredits[plan] ?? 0) : order.billing_period === "yearly" ? config.monthlyCredits * 12 : config.monthlyCredits;
    const { error: grantError } = await (admin.rpc as any)("grant_plan_credits", { p_workspace_id: order.workspace_id, p_plan: plan, p_credits: credits });
    if (grantError) throw new Error(`Failed to grant payment credits: ${grantError.message}`);
  }
  return { status: nextStatus };
}

/** Extract identifiers emitted by provider webhooks for matching one-time orders. */
export function extractPaymentOrderIdentifiers(event: PaymentEvent) {
  const raw = event.raw as any;
  const object = raw?.data?.object ?? raw?.object ?? raw?.resource ?? raw ?? {};
  const metadata = object?.metadata ?? raw?.metadata ?? {};
  const paypalPurchaseUnit = object?.purchase_units?.[0] ?? raw?.resource?.purchase_units?.[0];
  const customId = paypalPurchaseUnit?.custom_id ?? object?.custom_id;
  const orderNo = typeof metadata?.order_no === "string"
    ? metadata.order_no
    : typeof customId === "string" && customId.includes(":")
      ? customId.slice(customId.lastIndexOf(":") + 1)
      : undefined;
  return {
    providerSessionId: event.session.providerSessionId || undefined,
    providerTransactionId: event.session.providerTransactionId || undefined,
    orderNo,
  };
}

async function findPaymentOrder(admin: AdminSupabaseClient, event: PaymentEvent) {
  const ids = extractPaymentOrderIdentifiers(event);
  const base = (admin as any).from("payment_orders").select("*").eq("provider", event.provider);
  if (ids.providerSessionId) {
    const { data, error } = await base.eq("provider_session_id", ids.providerSessionId).maybeSingle();
    if (error) throw new Error(`Failed to find payment order: ${error.message}`);
    if (data) return data;
  }
  if (ids.providerTransactionId) {
    const { data, error } = await (admin as any).from("payment_orders").select("*").eq("provider", event.provider).eq("provider_transaction_id", ids.providerTransactionId).maybeSingle();
    if (error) throw new Error(`Failed to find payment order: ${error.message}`);
    if (data) return data;
  }
  if (ids.orderNo) {
    const { data, error } = await (admin as any).from("payment_orders").select("*").eq("provider", event.provider).eq("order_no", ids.orderNo).maybeSingle();
    if (error) throw new Error(`Failed to find payment order: ${error.message}`);
    if (data) return data;
  }
  return null;
}

async function updateOrder(admin: AdminSupabaseClient, id: string, status: PaymentOrderStatus, event: PaymentEvent) {
  const { error } = await (admin as any).from("payment_orders").update({ status, payment_result: event.raw, updated_at: new Date().toISOString() }).eq("id", id).in("status", ["created", "pending"]);
  if (error) throw new Error(`Failed to update payment order: ${error.message}`);
  return { status };
}
