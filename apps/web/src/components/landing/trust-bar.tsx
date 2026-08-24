"use client";

import { Layers, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { StaggerContainer, FadeUp } from "@/components/landing/motion";

interface PromiseItem {
  icon: typeof Sparkles;
  titleKey: string;
  descriptionKey: string;
}

const PROMISES: PromiseItem[] = [
  { icon: Sparkles, titleKey: "generateTitle", descriptionKey: "generateDescription" },
  { icon: Layers, titleKey: "composeTitle", descriptionKey: "composeDescription" },
  { icon: ShieldCheck, titleKey: "ownTitle", descriptionKey: "ownDescription" },
];

function PromiseItem({ item }: { item: PromiseItem }) {
  const t = useTranslations("landing.trustBar");
  const Icon = item.icon;

  return (
    <FadeUp className="flex gap-3 px-5 py-5 md:px-8 md:py-7">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
      <div>
        <p className="font-semibold text-foreground">{t(item.titleKey)}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t(item.descriptionKey)}
        </p>
      </div>
    </FadeUp>
  );
}

export function TrustBar() {
  return (
    <section className="landing-shell border-y border-border py-8 md:py-10">
      <StaggerContainer className="landing-grid grid divide-y divide-border px-4 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-6">
        {PROMISES.map((item) => (
          <PromiseItem key={item.titleKey} item={item} />
        ))}
      </StaggerContainer>
    </section>
  );
}
