"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { fadeUp, blurIn } from "@/components/landing/motion";
import { TypewriterText, useTypewriter } from "@/components/landing/typewriter";
import { LandingPrompt } from "@/components/landing/landing-prompt";

// ---------------------------------------------------------------------------
// HeroBadge
// ---------------------------------------------------------------------------

function HeroBadge() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="inline-flex items-center gap-2 border border-border bg-background px-3 py-1.5 text-sm"
    >
      <Sparkles className="size-3.5 text-accent" />
      <span className="text-muted-foreground">AI Marketing Creative Agent Canvas</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ScrollIndicator -- smooth sine wave
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AnimatedSubtitle -- separate to isolate motion state
// ---------------------------------------------------------------------------

function AnimatedSubtitle({ show }: { show: boolean }) {
  return (
    <motion.p
      variants={blurIn}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      className="mt-4 text-xs text-muted-foreground font-medium tracking-[0.12em] uppercase"
    >
      Where Ideas Become Reality
    </motion.p>
  );
}

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const headline = t("headline");
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
    <section className="landing-shell min-h-[100dvh] border-b border-border pt-24 md:pt-28">
      <div className="landing-grid grid items-center gap-10 px-4 pb-16 md:px-6 md:pb-20">
      <div className="mx-auto w-full max-w-7xl text-center">
        {/* Badge */}
        <HeroBadge />

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
        <AnimatedSubtitle show={showSub} />

        <div className="mt-8 pt-5"><LandingPrompt compact /></div>
      </div>
      </div>
    </section>
  );
}
