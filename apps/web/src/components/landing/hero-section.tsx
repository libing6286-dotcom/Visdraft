"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { fadeUp, blurIn } from "@/components/landing/motion";
import { TypewriterText, useTypewriter } from "@/components/landing/typewriter";
import { LandingPrompt } from "@/components/landing/landing-prompt";
import type { HomeExampleSelection } from "@/lib/home-example-seeds";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ScrollIndicator -- smooth sine wave
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AnimatedSubtitle -- separate to isolate motion state
// ---------------------------------------------------------------------------

function AnimatedSubtitle({ show, text }: { show: boolean; text: string }) {
  return (
    <motion.p
      variants={blurIn}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      className="mt-4 text-xs text-muted-foreground font-medium tracking-[0.12em] uppercase"
    >
      {text}
    </motion.p>
  );
}

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------

export function HeroSection({ headline: headlineOverride, subtitle: subtitleOverride, templateSelection }: { headline?: string; subtitle?: string; templateSelection?: HomeExampleSelection | null } = {}) {
  const t = useTranslations("landing.hero");
  const headline = headlineOverride ?? t("headline");
  const subtitle = subtitleOverride ?? "Where Ideas Become Reality";
  const { isComplete } = useTypewriter({
    text: headline,
    speed: 60,
    delay: 200,
  });
  const [showSub, setShowSub] = useState(false);

  // Compute typewriter total duration from the (localized) headline length.
  const typewriterEnd = 200 + headline.length * 60;
  const subtitleDelay = typewriterEnd + 400;

  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setShowSub(true), 400);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  return (
    <section className="landing-shell min-h-[50dvh] border-b border-border pt-12 md:pt-14">
      <div className="landing-grid grid items-center gap-10 px-4 pb-8 md:px-6 md:pb-10">
      <div className="mx-auto w-full max-w-7xl text-center">
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mt-6 whitespace-pre-line text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-5xl"
        >
          <TypewriterText text={headline} speed={60} delay={200} />
        </motion.h1>

        {/* English subtitle -- editorial style */}
        <AnimatedSubtitle show={showSub} text={subtitle} />

        <div className="mt-8 pt-5"><LandingPrompt compact {...(templateSelection !== undefined ? { templateSelection } : {})} /></div>
      </div>
      </div>
    </section>
  );
}
