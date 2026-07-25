import { defineRouting } from "next-intl/routing";

/**
 * i18n 路由配置（SSR + as-needed 前缀）。
 *
 * - en 为默认语言，URL 不带前缀（`/`、`/pricing`）。
 * - zh 带前缀（`/zh`、`/zh/pricing`）。
 * - localeDetection: middleware 会按 cookie(NEXT_LOCALE) → Accept-Language 自动选语言，
 *   因此无需客户端根重定向页。
 *
 * 默认语言可用 NEXT_PUBLIC_DEFAULT_LOCALE 覆盖（部署时配置）。
 */
export const locales = ["en", "zh"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as AppLocale) || "en";

/** 语言切换器展示名 */
export const localeNames: Record<AppLocale, string> = {
  en: "English",
  zh: "中文",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
});
