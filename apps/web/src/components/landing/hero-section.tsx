"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Layers, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, blurIn, scaleUp } from "@/components/landing/motion";
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
      <span className="text-muted-foreground">AI-Powered Creative Design</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animated cursor inside mockup canvas
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HeroMockup -- canvas interface preview
// Uses next/image with unoptimized for CLS prevention via explicit dimensions
// ---------------------------------------------------------------------------

function HeroMockup() {
  return (
    <motion.div
      variants={scaleUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 1.2 }}
      className="relative w-full overflow-hidden border border-border bg-card shadow-[0_8px_24px_oklch(0.18_0_0_/_0.08)]"
    >
      <div className="w-full overflow-hidden aspect-[4/3]">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium"><Layers className="size-3.5" /> Visdraft Canvas</span>
          <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground"><WandSparkles className="size-3 text-accent" /> Draft</span>
        </div>

        {/* Canvas area -- hero image is LCP candidate, loaded eagerly */}
        <div className="relative w-full h-full">
          <Image
            src="/images/showcase/showcase-12.jpg"
            alt="Visdraft Canvas AI creative workspace"
            width={1200}
            height={675}
            priority
            unoptimized
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
          />
          <div className="absolute left-[18%] top-[29%] h-[38%] w-[56%] border-2 border-accent/90" aria-hidden="true">
            <span className="absolute -top-6 left-0 bg-accent px-2 py-1 text-[10px] font-medium text-accent-foreground">Hero image</span>
            <span className="absolute -bottom-1 -right-1 size-2 bg-accent" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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
  const descDelay = (subtitleDelay + 200) / 1000;
  const ctaDelay = (subtitleDelay + 400) / 1000;

  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setShowSub(true), 400);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  return (
    <section className="landing-shell min-h-[100dvh] border-b border-border pt-24 md:pt-28">
      <div className="landing-grid grid items-center gap-10 px-4 pb-16 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:px-6 md:pb-20">
      <div className="max-w-xl">
        {/* Badge */}
        <HeroBadge />

        {/* Headline */}
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mt-6 text-5xl font-bold leading-[0.95] tracking-[-0.035em] text-foreground text-balance sm:text-6xl lg:text-7xl"
        >
          <TypewriterText text={headline} speed={60} delay={200} />
        </motion.h2>

        {/* English subtitle -- editorial style */}
        <AnimatedSubtitle show={showSub} />

        {/* Description */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: descDelay }}
          className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground md:text-lg text-pretty"
        >
          {t("description")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: ctaDelay }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/login"
            className={cn(
              "landing-action inline-flex items-center bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:-translate-y-0.5 active:translate-y-0",
            )}
          >
            {t("ctaStart")}
          </Link>
          <a
            href="#showcase"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("#showcase")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="landing-action group inline-flex items-center gap-2 border border-border px-5 py-3 text-base font-medium text-muted-foreground hover:border-foreground hover:text-foreground active:translate-y-px"
          >
            {t("ctaShowcase")}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
        <div className="mt-8 border-t border-border pt-5"><LandingPrompt compact /></div>
      </div>
      <HeroMockup />
      </div>
    </section>
  );
}
