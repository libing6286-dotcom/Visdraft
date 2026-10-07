import type { PaymentProvider, PaymentProviderName } from "./payment-types.js";

export class PaymentManager {
  private readonly providers = new Map<PaymentProviderName, PaymentProvider>();

  constructor(private readonly defaultName?: PaymentProviderName) {}

  add(provider: PaymentProvider) {
    this.providers.set(provider.name, provider);
  }

  names() {
    return [...this.providers.keys()];
  }

  get(name?: PaymentProviderName) {
    const selected = name ? this.providers.get(name) : undefined;
    if (selected) return selected;
    if (name) throw new Error(`Payment provider '${name}' is not configured`);
    const fallback = this.defaultName ? this.providers.get(this.defaultName) : undefined;
    return fallback ?? this.providers.values().next().value;
  }

  async cancel(name: PaymentProviderName, subscriptionId: string) {
    const provider = this.get(name);
    if (!provider?.cancelSubscription) throw new Error(`Provider '${name}' does not support cancellation`);
    await provider.cancelSubscription(subscriptionId);
  }

  async change(name: PaymentProviderName, subscriptionId: string, input: { productId: string; plan: string; billingPeriod: "monthly" | "yearly" }) {
    const provider = this.get(name);
    if (!provider?.changeSubscription) throw new Error(`Provider '${name}' does not support plan changes`);
    return provider.changeSubscription(subscriptionId, input);
  }
}
