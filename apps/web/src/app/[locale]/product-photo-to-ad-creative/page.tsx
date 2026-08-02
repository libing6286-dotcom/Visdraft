import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  Layers3,
  Megaphone,
  MousePointer2,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

const useCases = [
  "Product photo to Facebook ad creative",
  "Product photo to TikTok ad concept",
  "Product image to lifestyle ad",
  "Shopify product ad variations",
  "AI product photography for ads",
  "Fresh creatives for A/B testing",
];

const creativeBasics = [
  "Keep the product recognizable",
  "Show a clear use case or benefit",
  "Create scroll-stopping contrast",
  "Leave space for headline and CTA",
  "Match formats used on paid social",
  "Generate multiple creative angles for testing",
];

const channels = [
  "Facebook Ads",
  "Instagram Ads",
  "TikTok Ads",
  "Google Display Ads",
  "Shopify product campaigns",
  "Email banners",
  "Product launch creatives",
  "Retargeting ads",
];

const workflow = [
  {
    title: "Upload your product photo",
    description:
      "Start with a clean product image, packaging shot, model photo, or existing store asset.",
  },
  {
    title: "Choose your ad goal",
    description:
      "Generate creatives for awareness, product launch, discount promotion, retargeting, or seasonal campaigns.",
  },
  {
    title: "Pick your platform",
    description:
      "Create Facebook, TikTok, Instagram, Google, or Shopify-ready ad formats.",
  },
  {
    title: "Generate variations",
    description:
      "Get multiple layouts, backgrounds, headlines, and visual directions for testing.",
  },
  {
    title: "Export and launch",
    description: "Download ad creatives ready for your campaign workflow.",
  },
];

const trustItems = [
  "Product-first compositions",
  "Multiple ad variations from one upload",
  "Export-ready formats",
  "Clear commercial use cases",
  "Fast creative testing workflow",
  "No design experience required",
];

const faqs = [
  {
    question: "Can I create ads from one product photo?",
    answer:
      "Yes. Upload one product photo and generate multiple ad creative variations with different backgrounds, layouts, headlines, and formats.",
  },
  {
    question: "Is this for Shopify product ads?",
    answer:
      "Yes. Visdraft is designed for Shopify sellers and ecommerce teams that need product ad creatives for campaigns, store promotions, and paid social testing.",
  },
  {
    question: "Can I make Facebook or TikTok ads from a product image?",
    answer:
      "Yes. You can generate product photo to Facebook ad and product photo to TikTok ad concepts using your existing product image.",
  },
  {
    question: "Is this different from an AI image generator?",
    answer:
      "Yes. A general AI image generator creates images. Visdraft creates ad-focused product visuals with ecommerce layouts, campaign angles, and platform-ready formats.",
  },
  {
    question: "Do I need design skills?",
    answer:
      "No. Visdraft is built for founders, marketers, and ecommerce operators who need ad creatives without starting from a blank design tool.",
  },
];

function VisualPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border bg-card p-4"
      aria-label="Preview of product photos becoming ad creatives"
    >
      <div className="grid gap-3 sm:grid-cols-[0.78fr_1fr]">
        <div className="rounded-lg border bg-background p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Product image
            </span>
            <Upload className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
            <div className="relative size-28 rounded-xl border bg-background p-4">
              <div className="absolute left-5 right-5 top-5 h-6 rounded-md bg-[oklch(0.90_0.17_115)]" />
              <div className="absolute bottom-5 left-6 right-6 h-16 rounded-lg border bg-card" />
              <div className="absolute bottom-9 left-10 right-10 h-5 rounded bg-foreground" />
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            ["Meta 1:1", "Launch offer", "Shop Now"],
            ["TikTok 9:16", "Creator angle", "Try Today"],
            ["Shopify", "Product banner", "View Product"],
          ].map(([format, angle, cta]) => (
            <div key={format} className="rounded-lg border bg-background p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {format}
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  {angle}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-14 shrink-0 rounded-md bg-[oklch(0.90_0.17_115)]" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 h-2.5 w-4/5 rounded bg-foreground" />
                  <div className="h-2 w-2/3 rounded bg-muted-foreground/35" />
                </div>
                <div className="hidden h-7 shrink-0 items-center rounded-md bg-foreground px-3 text-[11px] font-medium text-background sm:flex">
                  {cta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionIntro({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 text-base leading-7 text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export default function ProductPhotoToAdCreativePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-foreground" aria-hidden />
              AI product ad generator for ecommerce teams
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Turn Product Photos Into Ad Creatives
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upload one product photo. Visdraft turns it into polished ad
              creatives, lifestyle product shots, platform-ready layouts,
              headlines, and CTA variations built for ecommerce testing.
            </p>
            <p className="mt-4 text-base font-medium text-foreground">
              No photoshoot. No designer. No blank canvas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Generate Product Ads
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
              AI product ad generator for Shopify stores, ecommerce brands, and
              performance marketers who need fresh ad creatives from existing
              product images.
            </p>
          </div>

          <VisualPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionIntro title="Built Around the Real Workflow of Product Advertising">
            <p>
              Most ecommerce teams do not need one perfect ad. They need 20
              clear variations they can test quickly.
            </p>
            <p className="mt-4">
              Visdraft is built around the real workflow of product advertising:
              upload a product image, choose the channel, generate multiple
              ad-ready concepts, compare angles, and export creatives for Meta,
              TikTok, Instagram, Google Display, or your Shopify product
              campaigns.
            </p>
          </SectionIntro>

          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border bg-card p-4"
              >
                <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:px-8">
          <SectionIntro title="Designed for Ecommerce Ad Creative, Not Just Image Generation">
            <p>
              Generic AI image tools make attractive visuals. Visdraft focuses on
              ad creative structure: product clarity, visual hierarchy, offer
              framing, headline placement, CTA space, platform ratio, and
              variation volume.
            </p>
            <p className="mt-4">
              From one product photo, you can create ad concepts for discounts,
              feature highlights, lifestyle scenes, seasonal campaigns,
              UGC-style ads, launch promotions, and retargeting creatives.
            </p>
          </SectionIntro>

          <div className="rounded-xl border bg-background p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-[oklch(0.90_0.17_115)] text-foreground">
                <BadgeCheck className="size-5" aria-hidden />
              </div>
              <h3 className="font-semibold tracking-tight">
                Ecommerce creative basics
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {creativeBasics.map((item) => (
                <div key={item} className="text-sm leading-6 text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <SectionIntro title="Built for the Channels Ecommerce Teams Actually Use">
          <p>
            Whether you sell through Shopify, Amazon, WooCommerce, Etsy, or your
            own DTC site, Visdraft helps turn product images into campaign-ready
            creative assets.
          </p>
          <p className="mt-4">
            Instead of starting from templates, Visdraft starts from your actual
            product photo, so every output stays anchored to the item you are
            selling.
          </p>
        </SectionIntro>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel) => (
            <div key={channel} className="rounded-lg border bg-card p-4">
              <Megaphone className="mb-4 size-5 text-foreground" aria-hidden />
              <h3 className="text-sm font-semibold">{channel}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionIntro title="From Product Image to Ad Generator in Minutes">
              <p>
                Move from one uploaded product image to multiple campaign-ready
                directions without leaving the creative workspace.
              </p>
            </SectionIntro>

            <div className="grid gap-4">
              {workflow.map((step, index) => (
                <div
                  key={step.title}
                  className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[2.5rem_1fr]"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionIntro title="Your Product Remains the Focus">
            <p>
              Ad creatives only work when customers can immediately understand
              what is being sold. Visdraft keeps the product visible, clean, and
              central while generating backgrounds, scenes, copy angles, and
              layouts around it.
            </p>
          </SectionIntro>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted p-4">
              <Camera className="mb-6 size-5" aria-hidden />
              <p className="text-sm font-medium">Product shot</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <Layers3 className="mb-6 size-5" aria-hidden />
              <p className="text-sm font-medium">Ad layout</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <ShoppingBag className="mb-6 size-5" aria-hidden />
              <p className="text-sm font-medium">Store ready</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            More Than AI Product Photography
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            AI product photography helps you create better product visuals.
            Visdraft goes further by turning those visuals into advertising
            assets.
          </p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            You do not just get a prettier product image. You get ad creative
            concepts with layout, message, visual context, and platform intent.
          </p>
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionIntro title="AI Product Ad Generator for Faster Creative Testing">
              <p>
                Visdraft is an AI product ad generator that helps ecommerce
                teams convert product photos into ad creatives for paid social
                and online stores.
              </p>
            </SectionIntro>
            <div className="rounded-xl border bg-background p-6 text-base leading-7 text-muted-foreground">
              <p>
                Upload a product image and generate Facebook ads, TikTok ad
                creatives, Instagram promotions, Shopify product banners, and
                lifestyle product photography for ads.
              </p>
              <p className="mt-4">
                If you are searching for a product image to ad generator,
                product photo ad generator, Shopify product ad generator, or AI
                product photography for ads, Visdraft helps you move from a
                single product photo to multiple campaign-ready creative
                variations without hiring a designer or scheduling a photoshoot.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Questions Product Marketers Ask Before Generating Ads
        </h2>
        <div className="mt-8 divide-y rounded-xl border bg-card">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {faq.question}
                <MousePointer2
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Start with one product photo.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate ad-ready creative directions inside Visdraft.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Generate Product Ads
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
