"use client";

import { MessageSquare, Sparkles, Paintbrush } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/landing/section-header";
import { StaggerContainer, FadeUp } from "@/components/landing/motion";

// ---------------------------------------------------------------------------
// Step data
// Keyframe `landing-icon-pulse` is defined in globals.css
// ---------------------------------------------------------------------------

interface Step {
  number: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const STEPS: Step[] = [
  { number: "01", icon: MessageSquare, titleKey: "step1Title", descKey: "step1Desc" },
  { number: "02", icon: Sparkles, titleKey: "step2Title", descKey: "step2Desc" },
  { number: "03", icon: Paintbrush, titleKey: "step3Title", descKey: "step3Desc" },
];

// ---------------------------------------------------------------------------
// StepCard
// ---------------------------------------------------------------------------

function StepCard({ step, isLast }: { step: Step; isLast: boolean }) {
  const t = useTranslations("landing.howItWorks");
  const Icon = step.icon;

  return (
    <FadeUp
      className={cn(
        "relative p-8 rounded-2xl bg-background border border-border/60",
        "hover:border-accent/40 hover:-translate-y-1",
        "transition-all duration-300 group overflow-hidden",
      )}
    >
      {/* Gradient top border -- 2px accent line fading out */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.90 0.17 115 / 0.6) 50%, transparent 100%)",
        }}
      />

      {/* Large watermark number -- gradient text */}
      <span
        className="absolute top-4 right-5 text-6xl font-bold leading-none select-none pointer-events-none bg-gradient-to-b from-accent/20 to-transparent bg-clip-text"
        style={{ WebkitTextFillColor: "transparent" }}
        aria-hidden="true"
      >
        {step.number}
      </span>

      {/* Icon circle -- pulse animation on scroll */}
      <div
        className={cn(
          "size-12 rounded-full flex items-center justify-center mb-6",
          "bg-accent/10 text-accent",
          "transition-colors duration-200 group-hover:bg-accent/20",
        )}
        style={{
          animation: "landing-icon-pulse 2s ease-out 0.6s 1",
        }}
      >
        <Icon className="size-5" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {t(step.titleKey)}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t(step.descKey)}
      </p>

      {/* Desktop connector arrow (hidden on last card) */}
      {!isLast && (
        <div
          className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 items-center justify-center"
          aria-hidden="true"
        >
          <div className="size-12 rounded-full bg-background border border-border/60 flex items-center justify-center shadow-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className="text-muted-foreground/50"
              fill="currentColor"
            >
              <path d="M7.293 1.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 1 1-1.414-1.414L10.586 8H1a1 1 0 1 1 0-2h9.586L7.293 2.707a1 1 0 0 1 0-1.414z" />
            </svg>
          </div>
        </div>
      )}
    </FadeUp>
  );
}

// ---------------------------------------------------------------------------
// HowItWorks
// ---------------------------------------------------------------------------

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        {/* Section header */}
        <div className="mb-16 md:mb-20">
          <SectionHeader
            title={t("title")}
            subtitle={t("subtitle")}
          />
        </div>

        {/* Steps grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {STEPS.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
