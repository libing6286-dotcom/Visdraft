import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

type PageMetadata = {
  title: string;
  description: string;
  keywords: string;
};

type CommonMessages = {
  pages: Record<string, PageMetadata>;
};

function readProjectFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath: string): CommonMessages {
  return JSON.parse(readProjectFile(relativePath)) as CommonMessages;
}

describe("localized SEO metadata", () => {
  it("defines page-specific metadata copy for home and pricing in every locale", () => {
    for (const locale of ["en", "zh"]) {
      const messages = readJson(`src/messages/${locale}/common.json`);

      expect(messages.pages.home.title).toBeTruthy();
      expect(messages.pages.home.description).toBeTruthy();
      expect(messages.pages.home.keywords).toBeTruthy();
      expect(messages.pages.pricing.title).toBeTruthy();
      expect(messages.pages.pricing.description).toBeTruthy();
      expect(messages.pages.pricing.keywords).toBeTruthy();
      expect(messages.pages.productPhotoToAdCreative.title).toBeTruthy();
      expect(messages.pages.productPhotoToAdCreative.description).toBeTruthy();
      expect(messages.pages.productPhotoToAdCreative.keywords).toBeTruthy();
    }
  });

  it("targets public landing metadata by locale", () => {
    const en = readJson("src/messages/en/common.json");
    const zh = readJson("src/messages/zh/common.json");

    expect(en.pages.landing.title).toBe(
      "Visdraft - AI Design Workspace for Creative Teams",
    );
    expect(en.pages.landing.description).toContain(
      "brand visuals, social content",
    );
    expect(en.pages.landing.keywords).toContain("AI design workspace");

    expect(zh.pages.landing.title).toBe(
      "Visdraft - AI 设计工作空间与品牌视觉生成工具",
    );
    expect(zh.pages.landing.description).toContain("AI 视觉创作工具");
    expect(zh.pages.landing.keywords).toContain("AI 设计工作空间");
  });

  it("keeps the public landing page h1 detectable before animation runs", () => {
    const landingPrompt = readProjectFile(
      "src/components/landing/landing-prompt.tsx",
    );
    const heroSection = readProjectFile(
      "src/components/landing/hero-section.tsx",
    );

    expect(landingPrompt).toContain("<motion.h1");
    expect(landingPrompt).toContain('{t("seoHeadline")}');
    expect(landingPrompt).not.toContain("<motion.h2");
    expect(heroSection).not.toContain("<motion.h1");
  });

  it("uses page-specific metadata namespaces in route layouts", () => {
    const localeLayout = readProjectFile("src/app/[locale]/layout.tsx");
    expect(localeLayout).not.toContain("common.pages.home");

    const directHomePagePath = path.join(root, "src/app/[locale]/page.tsx");
    expect(existsSync(directHomePagePath)).toBe(true);

    const landingHomeLayoutPath = path.join(
      root,
      "src/app/[locale]/(home)/layout.tsx",
    );
    expect(existsSync(landingHomeLayoutPath)).toBe(false);

    const homeLayoutPath = path.join(
      root,
      "src/app/[locale]/(workspace)/home/layout.tsx",
    );
    expect(existsSync(homeLayoutPath)).toBe(true);

    const homeLayout = readFileSync(homeLayoutPath, "utf8");
    expect(homeLayout).toContain('namespace: "common.pages.home"');
    expect(homeLayout).toContain('path: "/home"');

    const pricingLayoutPath = path.join(
      root,
      "src/app/[locale]/pricing/layout.tsx",
    );
    expect(existsSync(pricingLayoutPath)).toBe(true);

    const pricingLayout = readFileSync(pricingLayoutPath, "utf8");
    expect(pricingLayout).toContain('namespace: "common.pages.pricing"');
    expect(pricingLayout).toContain('path: "/pricing"');

    const privacyLayoutPath = path.join(
      root,
      "src/app/[locale]/privacy/layout.tsx",
    );
    expect(existsSync(privacyLayoutPath)).toBe(true);

    const privacyLayout = readFileSync(privacyLayoutPath, "utf8");
    expect(privacyLayout).toContain('namespace: "common.pages.privacy"');
    expect(privacyLayout).toContain('path: "/privacy"');

    const contactLayoutPath = path.join(
      root,
      "src/app/[locale]/contact/layout.tsx",
    );
    expect(existsSync(contactLayoutPath)).toBe(true);

    const contactLayout = readFileSync(contactLayoutPath, "utf8");
    expect(contactLayout).toContain('namespace: "common.pages.contact"');
    expect(contactLayout).toContain('path: "/contact"');

    const productPhotoToAdCreativeLayoutPath = path.join(
      root,
      "src/app/[locale]/product-photo-to-ad-creative/layout.tsx",
    );
    expect(existsSync(productPhotoToAdCreativeLayoutPath)).toBe(true);

    const productPhotoToAdCreativeLayout = readFileSync(
      productPhotoToAdCreativeLayoutPath,
      "utf8",
    );
    expect(productPhotoToAdCreativeLayout).toContain(
      'namespace: "common.pages.productPhotoToAdCreative"',
    );
    expect(productPhotoToAdCreativeLayout).toContain(
      'path: "/product-photo-to-ad-creative"',
    );
  });

  it("keeps route metadata paths canonical", () => {
    const homeLayout = readProjectFile(
      "src/app/[locale]/(workspace)/home/layout.tsx",
    );
    expect(homeLayout).toContain('path: "/home"');

    const pricingLayoutPath = path.join(
      root,
      "src/app/[locale]/pricing/layout.tsx",
    );
    expect(existsSync(pricingLayoutPath)).toBe(true);

    const pricingLayout = readFileSync(pricingLayoutPath, "utf8");
    expect(pricingLayout).toContain('namespace: "common.pages.pricing"');
    expect(pricingLayout).toContain('path: "/pricing"');

    const productPhotoToAdCreativeLayout = readProjectFile(
      "src/app/[locale]/product-photo-to-ad-creative/layout.tsx",
    );
    expect(productPhotoToAdCreativeLayout).toContain(
      'path: "/product-photo-to-ad-creative"',
    );
  });

  it("marks auth and workspace routes as noindex", () => {
    const noIndexRoutes = [
      "src/app/[locale]/login/layout.tsx",
      "src/app/[locale]/register/layout.tsx",
      "src/app/[locale]/auth/callback/layout.tsx",
      "src/app/[locale]/(workspace)/layout.tsx",
      "src/app/[locale]/(workspace)/home/layout.tsx",
    ];

    for (const relativePath of noIndexRoutes) {
      const routePath = path.join(root, relativePath);
      expect(existsSync(routePath), `${relativePath} should exist`).toBe(true);

      const source = readFileSync(routePath, "utf8");
      expect(source, `${relativePath} should use getMetadata`).toContain(
        "getMetadata",
      );
      expect(source, `${relativePath} should set noIndex`).toContain(
        "noIndex: true",
      );
    }
  });

  it("defines robots rules for public and private routes", () => {
    const robotsPath = path.join(root, "src/app/robots.ts");
    expect(existsSync(robotsPath), "robots.ts should exist").toBe(true);

    const source = readFileSync(robotsPath, "utf8");
    expect(source).toContain("MetadataRoute.Robots");
    expect(source).toContain('userAgent: "*"');
    expect(source).toContain('allow: "/"');
    expect(source).toContain("sitemap: `${siteUrl}/sitemap.xml`");
    expect(source).toContain("locales");
    expect(source).toContain("defaultLocale");
    expect(source).toContain("disallow.add(`/${locale}${privatePath}`)");

    expect(source).not.toContain('"/login"');
    expect(source).not.toContain('"/register"');

    expect(source).not.toContain('"/home"');

    for (const disallowedPath of [
      "/auth/",
      "/projects",
      "/settings",
      "/skills",
      "/brand-kit",
      "/canvas",
      "/loading-preview",
    ]) {
      expect(source).toContain(`"${disallowedPath}"`);
    }
  });

  it("keeps noindex routes out of the sitemap", () => {
    const sitemap = readProjectFile("src/app/sitemap.ts");

    expect(sitemap).toContain('"/"');
    expect(sitemap).toContain('"/product-photo-to-ad-creative"');
    expect(sitemap).not.toContain('"/pricing"');
    expect(sitemap).not.toContain('"/login"');
    expect(sitemap).not.toContain('"/register"');
    expect(sitemap).not.toContain('"/home"');
  });

  it("ships the product photo to ad creative SEO page copy", () => {
    const page = readProjectFile(
      "src/app/[locale]/product-photo-to-ad-creative/page.tsx",
    );
    const en = readJson("src/messages/en/common.json");

    expect(en.pages.productPhotoToAdCreative.title).toBe(
      "Product Photo to Ads | AI Product Ad Generator",
    );
    expect(en.pages.productPhotoToAdCreative.description).toContain(
      "Turn one product photo into ad creatives",
    );
    expect(page).toContain("Turn Product Photos Into Ads");
    expect(page).toContain("product image to ad generator");
    expect(page).toContain("AI product photography for ads");
    expect(page).toContain("<h1");
  });

  it("uses the production site URL as the SEO fallback", () => {
    const seo = readProjectFile("src/lib/seo.ts");

    expect(seo).toContain('"https://visdraft.com"');
    expect(seo).not.toContain('"http://localhost:3000"');
  });

  it("adds homepage structured data without FAQPage markup", () => {
    const seo = readProjectFile("src/lib/seo.ts");
    const rootPage = readProjectFile("src/app/page.tsx");

    expect(seo).toContain("getLandingStructuredData");
    expect(seo).toContain('"@graph"');
    expect(seo).toContain('"Organization"');
    expect(seo).toContain('"WebSite"');
    expect(seo).toContain('"SoftwareApplication"');
    expect(seo).toContain('"DesignApplication"');
    expect(seo).toContain('"https://visdraft.com"');
    expect(seo).not.toContain('"FAQPage"');

    expect(rootPage).toContain("getLandingStructuredData");
    expect(rootPage).toContain('type="application/ld+json"');
    expect(rootPage).toContain("JSON.stringify(getLandingStructuredData())");
  });

  it("canonicalizes public domain and protocol at the edge", () => {
    const nextConfig = readProjectFile("next.config.ts");
    const wrangler = readProjectFile("wrangler.jsonc");

    expect(wrangler).toContain('"pattern": "visdraft.com"');
    expect(wrangler).toContain('"pattern": "www.visdraft.com"');
    expect(wrangler).toContain('"custom_domain": true');

    expect(nextConfig).toContain("async redirects()");
    expect(nextConfig).toContain('source: "/"');
    expect(nextConfig).toContain('destination: "https://visdraft.com/"');
    expect(nextConfig).toContain('type: "host"');
    expect(nextConfig).toContain('value: "www.visdraft.com"');
    expect(nextConfig).toContain('source: "/:path+"');
    expect(nextConfig).toContain('destination: "https://visdraft.com/:path+"');
    expect(nextConfig).not.toContain('source: "/:path*"');
    expect(nextConfig).not.toContain(
      'destination: "https://visdraft.com/:path*"',
    );
    expect(nextConfig).not.toContain('key: "x-forwarded-proto"');
    expect(nextConfig).toContain("permanent: true");
  });

  it("falls back to the default locale for root metadata without route params", () => {
    const seo = readProjectFile("src/lib/seo.ts");
    const rootPage = readProjectFile("src/app/page.tsx");

    expect(rootPage).toContain("getMetadata");
    expect(seo).toContain("params?: Promise<{ locale?: string }>");
    expect(seo).toContain("const locale = requestedLocale || defaultLocale");
    expect(seo).toContain("setRequestLocale(locale)");
  });

  it("declares browser tab icons in the root layout", () => {
    const rootLayout = readProjectFile("src/app/layout.tsx");

    expect(rootLayout).toContain("export const metadata");
    expect(rootLayout).toContain('url: "/favicon.svg"');
    expect(rootLayout).toContain('url: "/apple-touch-icon.png"');
  });

  it("keeps a visible h1 on the login page", () => {
    const authShell = readProjectFile("src/components/auth/auth-shell.tsx");
    const loginForm = readProjectFile("src/components/login-form.tsx");
    const loginPage = readProjectFile("src/app/[locale]/login/page.tsx");

    expect(authShell).not.toContain("<h1");
    expect(loginPage).toContain("<h1");
    expect(loginForm).toContain("<h1");
    expect(loginForm).toContain('{t("welcomeBack")}');
  });

  it("rewrites default-locale routes that omit the locale prefix", () => {
    const nextConfig = readProjectFile("next.config.ts");

    expect(nextConfig).toContain("DEFAULT_LOCALE_REWRITE_PATHS");
    expect(nextConfig).toContain("destination: `/${defaultLocale}${source}`");

    for (const route of [
      "/pricing",
      "/product-photo-to-ad-creative",
      "/privacy",
      "/contact",
      "/login",
      "/register",
      "/auth/callback",
      "/home",
      "/projects",
      "/settings",
      "/skills",
      "/brand-kit",
      "/canvas",
      "/loading-preview",
    ]) {
      expect(nextConfig).toContain(`"${route}"`);
    }
  });
});
