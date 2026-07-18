import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo";

const PRIVATE_PATHS = [
  "/login",
  "/register",
  "/auth/",
  "/home",
  "/projects",
  "/settings",
  "/skills",
  "/brand-kit",
  "/canvas",
  "/loading-preview",
];

function localizedPrivatePaths(): string[] {
  const disallow = new Set(PRIVATE_PATHS);

  for (const locale of locales) {
    if (locale === defaultLocale) continue;

    for (const privatePath of PRIVATE_PATHS) {
      disallow.add(`/${locale}${privatePath}`);
    }
  }

  return [...disallow];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: localizedPrivatePaths(),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
