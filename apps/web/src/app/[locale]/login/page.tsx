"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Suspense, useEffect } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/lib/auth-context";

// 回调错误码 → 翻译键（消息在 auth.callbackErrors 下，按 locale 解析）
const CALLBACK_ERROR_KEYS: Record<string, string> = {
  auth_callback_missing_code: "missingCode",
  auth_exchange_failed: "exchangeFailed",
  viewer_bootstrap_failed: "viewerBootstrapFailed",
  auth_callback_timeout: "timeout",
};

function LoginPageContent() {
  const t = useTranslations("auth");
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const initialErrorMessage = callbackError
    ? t(`callbackErrors.${CALLBACK_ERROR_KEYS[callbackError] ?? "generic"}`)
    : null;

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  if (loading || user) return <LoadingScreen />;

  return (
    <AuthShell
      title={t("login.title")}
      description={t("login.description")}
      features={[
        t("login.feature1"),
        t("login.feature2"),
        t("login.feature3"),
      ]}
    >
      <LoginForm initialErrorMessage={initialErrorMessage} />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginPageContent />
    </Suspense>
  );
}
