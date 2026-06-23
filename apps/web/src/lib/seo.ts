import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";

/**
 * 站点公开地址，用于 canonical / hreflang / OG 绝对 URL。
 * 部署时通过 NEXT_PUBLIC_SITE_URL 配置；本地缺省回退 localhost。
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

/** as-needed 规则下，把内部路径转成某 locale 的绝对 URL（默认语言不带前缀）。 */
export function localizedUrl(path: string, locale: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${siteUrl}${prefix}${clean || "/"}`.replace(/\/$/, "") || siteUrl;
}

/** 为某页面生成 hreflang alternates（en/zh + x-default）。 */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = localizedUrl(path, loc);
  }
  languages["x-default"] = localizedUrl(path, defaultLocale);
  return languages;
}

type GetMetadataOptions = {
  /** 翻译命名空间，含 title/description/keywords（默认回退 common.metadata） */
  namespace?: string;
  /** 当前页面的内部路径（用于 canonical / hreflang），如 "/pricing"。默认 "/" */
  path?: string;
  /** 覆盖图（OG/Twitter），相对路径或绝对 URL */
  imageUrl?: string;
  /** 是否禁止索引（如 authed 页面） */
  noIndex?: boolean;
};

/**
 * 统一的本地化 metadata 生成器。在 page/layout 里：
 *   export const generateMetadata = getMetadata({ namespace: "pages.pricing", path: "/pricing" });
 *
 * 产出本地化 title/description、canonical、hreflang alternates、og:locale。
 * 参考 shipany src/shared/lib/seo.ts 的封装思路，适配 Loomic（无服务依赖）。
 */
export function getMetadata(options: GetMetadataOptions = {}) {
  const { namespace = "common.metadata", path = "/", imageUrl, noIndex } = options;

  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);

    // 取命名空间翻译，缺失字段回退 common.metadata
    const t = await getTranslations({ locale, namespace });
    const fallback = await getTranslations({ locale, namespace: "common.metadata" });

    const title = t.has("title") ? t("title") : fallback("title");
    const description = t.has("description")
      ? t("description")
      : fallback("description");
    const keywords = t.has("keywords")
      ? t("keywords")
      : fallback.has("keywords")
        ? fallback("keywords")
        : undefined;

    const canonical = localizedUrl(path, locale);
    const ogLocale = locale === "zh" ? "zh_CN" : "en_US";
    const image = imageUrl ?? "/og-image.png";

    return {
      metadataBase: new URL(siteUrl),
      title,
      description,
      keywords,
      alternates: {
        canonical,
        languages: languageAlternates(path),
      },
      openGraph: {
        type: "website",
        locale: ogLocale,
        url: canonical,
        title,
        description,
        siteName: "Loomic",
        images: [{ url: image, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      robots: noIndex
        ? { index: false, follow: false }
        : { index: true, follow: true },
    };
  };
}

export type { AppLocale };
