"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { StaggerContainer, FadeUp } from "@/components/landing/motion";

interface StatItem {
  target: number;
  suffix: string;
  labelKey: string;
  decimals?: boolean;
}

const STATS: StatItem[] = [
  { target: 10000, suffix: "+", labelKey: "creators" },
  { target: 100000, suffix: "+", labelKey: "artworks" },
  { target: 50, suffix: "+", labelKey: "models" },
  { target: 99.9, suffix: "%", labelKey: "uptime", decimals: true },
];

function StatCard({ stat }: { stat: StatItem }) {
  const t = useTranslations("landing.trustBar");

  return (
    <FadeUp className="flex flex-col items-start gap-1.5 px-5 md:px-8">
      <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums md:text-4xl">
        <AnimatedCounter
          target={stat.target}
          suffix={stat.suffix}
          duration={stat.decimals ? 1800 : 2000}
        />
      </span>
      <span className="text-sm text-muted-foreground">{t(stat.labelKey)}</span>
    </FadeUp>
  );
}

export function TrustBar() {
  return (
    <section className="landing-shell border-y border-border py-8 md:py-10">
      <StaggerContainer className="landing-grid grid grid-cols-2 divide-x divide-y divide-border px-4 md:grid-cols-4 md:divide-y-0 md:px-6">
        {STATS.map((stat) => (
          <StatCard key={stat.labelKey} stat={stat} />
        ))}
      </StaggerContainer>
    </section>
  );
}
