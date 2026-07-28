import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";
import { localizedUrl, languageAlternates } from "@/lib/seo";

/**
 * 多语言 sitemap。
 *
 * 仅收录站点首页（中英版本）。
 * 每条目带 hreflang alternates，帮助搜索引擎理解中英版本对应关系。
 */
const PUBLIC_PATHS = ["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) =>
    locales.map((locale) => ({
      url: localizedUrl(path, locale),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
