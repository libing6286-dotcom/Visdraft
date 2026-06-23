"use client";

import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/landing/section-header";
import { StaggerContainer, scaleUp } from "@/components/landing/motion";

// ---------------------------------------------------------------------------
// Pricing plan data
// Keyframe `landing-border-shift` is defined in globals.css
// ---------------------------------------------------------------------------

interface PricingPlan {
  nameKey: string;
  badgeKey?: string;
  price: string;
  periodKey: string;
  featureKeys: string[];
  ctaKey: string;
  highlighted: boolean;
}

const PLANS: PricingPlan[] = [
  {
    nameKey: "freeName",
    price: "¥0",
    periodKey: "freePeriod",
    featureKeys: ["freeFeature1", "freeFeature2", "freeFeature3", "freeFeature4"],
    ctaKey: "freeCta",
    highlighted: false,
  },
  {
    nameKey: "proName",
    badgeKey: "proBadge",
    price: "¥99",
    periodKey: "proPeriod",
    featureKeys: [
      "proFeature1",
      "proFeature2",
      "proFeature3",
      "proFeature4",
      "proFeature5",
      "proFeature6",
    ],
    ctaKey: "proCta",
    highlighted: true,
  },
  {
    nameKey: "teamName",
    price: "¥299",
    periodKey: "teamPeriod",
    featureKeys: [
      "teamFeature1",
      "teamFeature2",
      "teamFeature3",
      "teamFeature4",
      "teamFeature5",
      "teamFeature6",
    ],
    ctaKey: "teamCta",
    highlighted: false,
  },
];

// ---------------------------------------------------------------------------
// PricingCard
// ---------------------------------------------------------------------------

function PricingCard({ plan }: { plan: PricingPlan }) {
  const t = useTranslations("landing.pricingPreview");
  return (
    <motion.div
      variants={scaleUp}
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 md:p-8 bg-card",
        "hover:-translate-y-1 transition-transform duration-300",
        plan.highlighted
          ? "border-2 md:-translate-y-2 shadow-xl hover:md:-translate-y-3"
          : "border-border",
      )}
      style={
        plan.highlighted
          ? {
              animation: "landing-border-shift 4s ease-in-out infinite",
              boxShadow: "0 0 32px 0 oklch(0.90 0.17 115 / 0.12)",
            }
          : {}
      }
    >
      {/* Badge */}
      {plan.badgeKey && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "oklch(0.90 0.17 115)",
              color: "oklch(0.2 0 0)",
            }}
          >
            <Sparkles className="size-3" />
            {t(plan.badgeKey)}
          </span>
        </div>
      )}

      {/* Plan name */}
      <p className="text-lg font-semibold text-foreground">{t(plan.nameKey)}</p>

      {/* Price */}
      <div className="mt-4">
        <span className="text-4xl font-bold text-foreground tabular-nums">
          {plan.price}
        </span>
        <span className="ml-2 text-sm text-muted-foreground">
          {t(plan.periodKey)}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mt-6 flex-1">
        {plan.featureKeys.map((featureKey) => (
          <li key={featureKey} className="flex items-center gap-3">
            <div
              className="size-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "oklch(0.90 0.17 115 / 0.15)",
              }}
            >
              <Check
                className="size-3 shrink-0"
                style={{ color: "oklch(0.65 0.17 115)" }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{t(featureKey)}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        {plan.highlighted ? (
          <button
            className={cn(
              "w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
            )}
            style={{
              background: "oklch(0.90 0.17 115)",
              color: "oklch(0.2 0 0)",
            }}
          >
            {t(plan.ctaKey)}
          </button>
        ) : (
          <Button variant="outline" className="w-full">
            {t(plan.ctaKey)}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PricingPreview
// ---------------------------------------------------------------------------

export function PricingPreview() {
  const t = useTranslations("landing.pricingPreview");
  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
      {/* Subtle dots grid background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.556 0 0) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="mb-14 md:mb-20">
          <SectionHeader
            title={t("title")}
            subtitle={t("subtitle")}
          />
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {PLANS.map((plan) => (
            <PricingCard key={plan.nameKey} plan={plan} />
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
