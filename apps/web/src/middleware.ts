import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * i18n middleware（仅处理多语言路由与语言协商）。
 *
 * as-needed 策略下，middleware 负责：
 * - 按 cookie(NEXT_LOCALE) → Accept-Language 检测语言并把 `/` 映射到对应内容；
 * - 为非默认语言补 `/zh` 前缀、为默认语言去前缀。
 *
 * 鉴权不在此处理：Loomic 的 Supabase 登录态在客户端（workspace layout 守卫）。
 */
export default createMiddleware(routing);

export const config = {
  // 跳过 API、Next 内部、Vercel 内部、以及带后缀的静态资源
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
