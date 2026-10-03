import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";

if (process.argv.includes("dev")) {
  initOpenNextCloudflareForDev();
}

if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SERVER_BASE_URL?.trim()
) {
  throw new Error(
    "Missing required production env: NEXT_PUBLIC_SERVER_BASE_URL must point to the deployed API origin.",
  );
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";
const DEFAULT_LOCALE_REWRITE_PATHS = [
  "/pricing",
  "/ai-product-photo-generator",
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
];

const nextConfig: NextConfig = {
  // 注意：已从 output:"export"（静态导出）切换到 SSR，以支持 next-intl 的
  // as-needed 路由、middleware 语言协商与营销页 SSR/SEO。

  // 关闭 streaming metadata：/.*/ 匹配所有 UA，令异步 generateMetadata 走「阻塞式」，
  // 使 title/description/canonical/hreflang/og 等标签始终注入原始 HTML 的 <head>，
  // 而非流式追加到 <body>。代价是 metadata 解析完成前不发首屏（TTFB 略增），
  // 换取对所有爬虫（含不执行 JS 者）100% 可预测的 SEO / 社交卡片元数据。
  // 该配置会覆盖内置默认 bot 清单；因 /.*/ 为其超集，不会遗漏任何默认爬虫。
  htmlLimitedBots: /.*/,

  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_SERVER_BASE_URL: process.env.NEXT_PUBLIC_SERVER_BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  async rewrites() {
    return DEFAULT_LOCALE_REWRITE_PATHS.map((source) => ({
      source,
      destination: `/${defaultLocale}${source}`,
    }));
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.visdraft.com" }],
        destination: "https://visdraft.com/",
        permanent: true,
      },
      {
        source: "/:path+",
        has: [{ type: "host", value: "www.visdraft.com" }],
        destination: "https://visdraft.com/:path+",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
