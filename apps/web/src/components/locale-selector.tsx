"use client";

import { useLocale } from "next-intl";
import { Check, Languages } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// cookie 名与 next-intl middleware 读取的保持一致，确保下次访问记住选择
const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * 语言切换器。切换时：
 * - 用 locale-aware router 在**保持当前路径**下切到目标语言；
 * - 写 NEXT_LOCALE cookie，使刷新/再次访问被 middleware 记住。
 *
 * type="icon" 仅图标（用于紧凑导航栏）；type="button" 带当前语言文字。
 */
export function LocaleSelector({
  type = "icon",
  className,
}: {
  type?: "icon" | "button";
  className?: string;
}) {
  const currentLocale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(locale: AppLocale) {
    if (locale === currentLocale) return;
    // 一年有效期，path=/ 全站可用
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    // pathname 不含 locale 前缀，router 会按目标 locale 自动补前缀
    if (locale === "en" && pathname === "/") {
      window.location.assign("/");
      return;
    }
    router.replace(pathname, { locale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={type === "icon" ? "icon" : "default"}
            aria-label="Switch language"
            className={className}
          >
            <Languages className="size-4" />
            {type === "button" ? (
              <span className="ml-1.5">{localeNames[currentLocale]}</span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-32">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className="justify-between"
          >
            {localeNames[locale]}
            <Check
              className={cn(
                "size-4",
                locale === currentLocale ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
