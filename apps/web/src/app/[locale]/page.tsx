import dynamic from "next/dynamic";
import { FloatingNav } from "@/components/landing/floating-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustBar } from "@/components/landing/trust-bar";

// ---------------------------------------------------------------------------
// Below-fold sections — lazy-loaded via next/dynamic to reduce initial bundle.
// Each section is its own chunk, loaded when React renders the component.
// Combined with IntersectionObserver inside motion.tsx (whileInView), these
// chunks are requested only as the user scrolls near them.
// ---------------------------------------------------------------------------

const FeatureShowcase = dynamic(
  () =>
    import("@/components/landing/feature-showcase").then(
      (m) => m.FeatureShowcase,
    ),
);

const ShowcaseGallery = dynamic(
  () =>
    import("@/components/landing/showcase-gallery").then(
      (m) => m.ShowcaseGallery,
    ),
);

const HowItWorks = dynamic(
  () =>
    import("@/components/landing/how-it-works").then((m) => m.HowItWorks),
);

const PricingPreview = dynamic(
  () =>
    import("@/components/landing/pricing-preview").then(
      (m) => m.PricingPreview,
    ),
);

const FinalCTA = dynamic(
  () => import("@/components/landing/final-cta").then((m) => m.FinalCTA),
);

const LandingFooter = dynamic(
  () =>
    import("@/components/landing/landing-footer").then(
      (m) => m.LandingFooter,
    ),
);

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      <FloatingNav />
      <main>
        {/* Above-fold: eagerly loaded for fast LCP */}
        <HeroSection />
        <TrustBar />

        {/* Below-fold: code-split, loaded on demand */}
        <ShowcaseGallery />
        <FeatureShowcase />
        <HowItWorks />
        <PricingPreview />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
