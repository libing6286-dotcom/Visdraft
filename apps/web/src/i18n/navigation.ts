import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * locale-aware 导航封装。
 *
 * 用法：把组件里 `import Link from "next/link"` 换成
 * `import { Link } from "@/i18n/navigation"`；
 * `useRouter/usePathname/redirect` 从 `next/navigation` 换到这里。
 *
 * 路径字符串照常写不带 locale 前缀的内部路径（如 "/home"），
 * 这些 API 会按当前 locale 自动补 `/zh` 前缀（en 为默认语言不补）。
 *
 * 注意：`useSearchParams` / `useParams` 仍从 `next/navigation` 引入。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
