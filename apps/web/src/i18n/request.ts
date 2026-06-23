import { getRequestConfig } from "next-intl/server";

import { defaultLocale, routing } from "./routing";

/**
 * 消息命名空间清单。每个条目对应 `src/messages/{locale}/<path>.json`。
 * 路径含 `/` 时会被还原成嵌套对象（如 `settings/profile` → messages.settings.profile）。
 *
 * 随 Phase 5 文案抽取逐步补全；缺失的文件由 loadMessages 容错为 {}。
 */
const localeMessagesPaths = [
  "common", // 共享：导航、按钮、通用错误、metadata
  "landing", // 落地页
  "pricing", // 定价页
  "auth", // 登录 / 注册
  "workspace", // home / projects / settings / 外壳
  "settings", // 设置页各分区（profile/agent/billing/usage）
  "canvas", // 画布
  "chat", // 聊天
  "brand-kit", // 品牌套件
  "skills", // 技能
  "credits", // 额度
];

/** 加载单个命名空间，缺失时回退默认语言，再缺失则空对象（不阻断渲染）。 */
export async function loadMessages(path: string, locale: string = defaultLocale) {
  try {
    return (await import(`@/messages/${locale}/${path}.json`)).default;
  } catch {
    try {
      return (await import(`@/messages/${defaultLocale}/${path}.json`)).default;
    } catch {
      // TODO(i18n): 该命名空间尚未创建对应 JSON（Phase 5 补全）
      return {};
    }
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  // 归一化中文变体：zh-CN / zh-TW / zh-HK → zh
  if (locale.startsWith("zh")) {
    locale = "zh";
  }

  const loaded = await Promise.all(
    localeMessagesPaths.map((path) => loadMessages(path, locale)),
  );

  // 按 path 还原嵌套结构合并
  const messages: Record<string, unknown> = {};
  localeMessagesPaths.forEach((path, index) => {
    const keys = path.split("/");
    let current = messages;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = current[keys[i]] ?? {};
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = loaded[index];
  });

  return { locale, messages };
});
