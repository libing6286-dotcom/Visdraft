import type { Metadata } from "next";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMetadata } from "@/lib/seo";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingScenes } from "@/components/landing/landing-scenes";
import { ProductPhotoTemplates } from "@/components/landing/product-photo-templates";

const baseMetadata = getMetadata({ path: "/ai-product-photo-generator" });
export async function generateMetadata(props: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const metadata = await baseMetadata(props);
  const title = "AI Product Photo Generator | Visdraft";
  return { ...metadata, title, openGraph: { ...metadata.openGraph, title }, twitter: { ...metadata.twitter, title } };
}

const faqs = [["What is an AI product photo generator?", "It turns one product image into new studio scenes with professional lighting, backgrounds, and realistic shadows."], ["Can I use it for my online store?", "Yes. Generate square, portrait, or landscape images for Shopify, Amazon, Etsy, social ads, and more."], ["Do I need photography skills?", "No. Upload a clear product photo, choose a template, and describe the scene you want."], ["Can I try it for free?", "Yes. Start with free generations in your browser; paid plans add higher resolution and batch exports."]];
const scenes = [
  ["Amazon & Etsy sellers", "Turn one product photo into marketplace-ready listing images — pure white background for Amazon, warm lifestyle scenes for Etsy. Meet every platform's specs without a second shoot."],
  ["Shopify & WooCommerce stores", "Batch-generate hundreds of product photos at once. Keep your entire catalog looking professional across every product page, collection, and category."],
  ["DTC brands", "Keep every shot on-brand. Generate product photos for ads, emails, and landing pages — all with the same lighting, colors, and style your customers recognize."],
  ["Social & paid ads", "Stop the scroll. Create thumb-stopping product creatives for TikTok, Meta, and Google Ads in seconds — no agency, no shoot, no delays."],
] as const;
const sceneImages = [
  "/images/ai-product-photo-generator/bananaBag.webp",
  "/images/ai-product-photo-generator/magazine.webp",
  "/images/ai-product-photo-generator/perfume.webp",
  "/images/ai-product-photo-generator/sunProtection.webp",
] as const;

export default function AiProductPhotoGeneratorPage() {
  const structuredData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return <main className="min-h-screen bg-background text-foreground">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <header className="border-b"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"><Link href="/" className="flex items-center gap-2 font-semibold"><img src="/logo.svg" alt="Visdraft" className="size-7" /><span>Visdraft</span></Link><nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"><Link href="/" className="hover:text-foreground">AI tools</Link><Link href="/pricing" className="hover:text-foreground">Pricing</Link><Link href="/contact" className="hover:text-foreground">Resources</Link></nav><Link href="/login" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">Sign in</Link></div></header>

    {/* Shared landing hero: prompt input replaces the former upload dropzone. */}
    <HeroSection headline="AI Product Photo Generator" subtitle="Turn one product photo into studio-quality images — any background, any scene, in seconds." />

    <section><div className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See what you can create</h2><p className="mt-3 text-muted-foreground">One photo in. A complete visual catalog out.</p></div><ProductPhotoTemplates /></div></section>

    <LandingScenes scenes={scenes.map(([title, description], index) => ({ title, description, visual: <img src={sceneImages[index]!} alt={title} className="h-full w-full object-cover" /> }))} />

    {/* How it works */}<section className="border-y bg-muted/30"><div className="mx-auto max-w-7xl px-6 py-20"><h2 className="text-3xl font-semibold tracking-tight">How it works</h2><ol className="mt-8 grid gap-6 md:grid-cols-3">{[["Upload one product photo", "A phone photo is enough. No studio, no camera gear, no retouching."], ["Pick a scene or style", "White background, lifestyle table, marble surface, seasonal setup — dozens of presets."], ["Download studio-quality images", "High-resolution, web-ready files for your store, marketplace, and ads."]].map(([title, description], index) => <li key={title} className="flex gap-4 rounded-lg border bg-background p-5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">{index + 1}</span><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div></li>)}</ol></div></section>

    <section className="mx-auto max-w-3xl px-6 py-20"><h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2><div className="mt-8 divide-y rounded-xl border bg-card">{faqs.map(([q, a]) => <details key={q} className="group p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{q}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{a}</p></details>)}</div></section>
    <section className="border-t bg-foreground text-background"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-semibold">Ready to make your product stand out?</h2><p className="mt-2 text-sm opacity-70">Generate your first AI product photo for free.</p></div><Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-md bg-background px-5 text-sm font-medium text-foreground">Start creating <ArrowRight className="size-4" /></Link></div></section>
  </main>;
}
