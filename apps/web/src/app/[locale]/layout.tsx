import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { getMetadata } from "@/lib/seo";
import { routing } from "@/i18n/routing";

import { Providers } from "@/components/providers";

// 预生成两种语言的静态参数（SSR 下非必需，但利于按 locale 预渲染营销页）
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 本地化的根级 metadata（title/description/canonical/hreflang/og:locale）
export const generateMetadata = getMetadata({
  namespace: "common.pages.landing",
  path: "/",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 校验 locale，非法则 404（避免把任意段当作语言）
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 必须在使用任何 next-intl API 之前调用，启用静态渲染
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
