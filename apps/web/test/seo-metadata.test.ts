import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function readProjectFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath: string): any {
  return JSON.parse(readProjectFile(relativePath));
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
    }
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
    expect(source).toContain("userAgent: \"*\"");
    expect(source).toContain("allow: \"/\"");
    expect(source).toContain("sitemap: `${siteUrl}/sitemap.xml`");
    expect(source).toContain("locales");
    expect(source).toContain("defaultLocale");
    expect(source).toContain("disallow.add(`/${locale}${privatePath}`)");

    expect(source).not.toContain("\"/login\"");
    expect(source).not.toContain("\"/register\"");

    for (const disallowedPath of [
      "/auth/",
      "/home",
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
    expect(sitemap).not.toContain('"/pricing"');
    expect(sitemap).not.toContain('"/login"');
    expect(sitemap).not.toContain('"/register"');
    expect(sitemap).not.toContain('"/home"');
  });

  it("uses the production site URL as the SEO fallback", () => {
    const seo = readProjectFile("src/lib/seo.ts");

    expect(seo).toContain('"https://visdraft.com"');
    expect(seo).not.toContain('"http://localhost:3000"');
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
    expect(loginForm).toContain("{t(\"welcomeBack\")}");
  });

  it("rewrites default-locale routes that omit the locale prefix", () => {
    const nextConfig = readProjectFile("next.config.ts");

    expect(nextConfig).toContain("DEFAULT_LOCALE_REWRITE_PATHS");
    expect(nextConfig).toContain('destination: `/${defaultLocale}${source}`');

    for (const route of [
      "/pricing",
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
