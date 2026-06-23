"use client";

import React from "react";
import Image from "next/image";
import {
  type LucideIcon,
  Layout,
  MessageSquare,
  Palette,
  MousePointer,
} from "lucide-react";
import { type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/landing/section-header";
import {
  ScrollReveal,
  slideInLeft,
  slideInRight,
} from "@/components/landing/motion";

// ---------------------------------------------------------------------------
// Feature visuals -- local high-res images matched to feature descriptions
// Using next/image with unoptimized (static export) for CLS prevention
// via explicit width/height and native lazy loading.
// ---------------------------------------------------------------------------

function CanvasVisual() {
  return (
    <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
      <Image
        src="/images/showcase/showcase-5.jpg"
        alt="AI canvas multi-person scene composition"
        width={800}
        height={600}
        unoptimized
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
      <Image
        src="/images/showcase/showcase-10.jpg"
        alt="AI understanding creative intent for fashion styling"
        width={800}
        height={600}
        unoptimized
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}

function BrandVisual() {
  return (
    <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
      <Image
        src="/images/showcase/showcase-11.jpg"
        alt="Consistent brand visual aesthetic"
        width={800}
        height={600}
        unoptimized
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}

function EditVisual() {
  return (
    <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
      <Image
        src="/images/showcase/showcase-3.jpg"
        alt="Pixel-level precision control for design elements"
        width={800}
        height={600}
        unoptimized
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gradient border wrapper for visual mockups
// ---------------------------------------------------------------------------

function GradientBorderCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Subtle glow behind card */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-0 transition-opacity duration-700 group-[.in-view]:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.90 0.17 115 / 0.12), transparent 70%)",
          transform: "scale(1.2)",
        }}
      />
      {/* Gradient border wrapper */}
      <div className="bg-gradient-to-br from-border via-transparent to-border p-px rounded-2xl">
        <div className="bg-card rounded-[calc(1rem-1px)] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature data type
// ---------------------------------------------------------------------------

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  visual: React.ReactNode;
  reversed: boolean;
  textVariants: Variants;
  visualVariants: Variants;
}

const FEATURES: Feature[] = [
  {
    icon: Layout,
    titleKey: "canvasTitle",
    descKey: "canvasDesc",
    visual: <CanvasVisual />,
    reversed: false,
    textVariants: slideInLeft,
    visualVariants: slideInRight,
  },
  {
    icon: MessageSquare,
    titleKey: "chatTitle",
    descKey: "chatDesc",
    visual: <ChatVisual />,
    reversed: true,
    textVariants: slideInRight,
    visualVariants: slideInLeft,
  },
  {
    icon: Palette,
    titleKey: "brandTitle",
    descKey: "brandDesc",
    visual: <BrandVisual />,
    reversed: false,
    textVariants: slideInLeft,
    visualVariants: slideInRight,
  },
  {
    icon: MousePointer,
    titleKey: "editTitle",
    descKey: "editDesc",
    visual: <EditVisual />,
    reversed: true,
    textVariants: slideInRight,
    visualVariants: slideInLeft,
  },
];

// ---------------------------------------------------------------------------
// FeatureItem
// ---------------------------------------------------------------------------

function FeatureItem({ feature }: { feature: Feature }) {
  const t = useTranslations("landing.features");
  const Icon = feature.icon;

  const textContent = (
    <ScrollReveal variants={feature.textVariants} className="flex flex-col gap-5">
      {/* Icon */}
      <div className="inline-flex w-fit rounded-xl bg-accent/10 p-2.5 text-accent">
        <Icon className="size-5" />
      </div>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
        {t(feature.titleKey)}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground leading-relaxed text-base">
        {t(feature.descKey)}
      </p>
    </ScrollReveal>
  );

  const visualContent = (
    <ScrollReveal variants={feature.visualVariants} className="relative">
      <GradientBorderCard>
        <div
          className={cn(
            "bg-gradient-to-br from-muted/50 to-muted/20",
            "p-6 md:p-8",
          )}
        >
          {feature.visual}
        </div>
      </GradientBorderCard>
    </ScrollReveal>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      {feature.reversed ? (
        <>
          {visualContent}
          {textContent}
        </>
      ) : (
        <>
          {textContent}
          {visualContent}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureDivider -- horizontal line between feature pairs
// ---------------------------------------------------------------------------

function FeatureDivider() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="w-full max-w-md h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.556 0 0 / 0.15) 30%, oklch(0.90 0.17 115 / 0.2) 50%, oklch(0.556 0 0 / 0.15) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureShowcase
// ---------------------------------------------------------------------------

export function FeatureShowcase() {
  const t = useTranslations("landing.features");
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="mb-20 md:mb-28">
          <SectionHeader
            title={t("title")}
            subtitle={t("subtitle")}
            className="[&_h2]:tracking-tighter"
          />
        </div>

        {/* Feature list */}
        <div className="space-y-24 md:space-y-32">
          {FEATURES.map((feature, index) => (
            <React.Fragment key={t(feature.titleKey)}>
              {index > 0 && <FeatureDivider />}
              <FeatureItem feature={feature} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
