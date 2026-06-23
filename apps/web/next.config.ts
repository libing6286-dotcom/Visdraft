import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // 注意：已从 output:"export"（静态导出）切换到 SSR，以支持 next-intl 的
  // as-needed 路由、middleware 语言协商与营销页 SSR/SEO。
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
};

export default withNextIntl(nextConfig);
