"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoadingScreen } from "@/components/loading-screen";
import { RegisterForm } from "@/components/register-form";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  if (loading || user) return <LoadingScreen />;

  return (
    <AuthShell
      title={t("register.title")}
      description={t("register.description")}
      features={[
        t("register.feature1"),
        t("register.feature2"),
        t("register.feature3"),
      ]}
    >
      <RegisterForm />
    </AuthShell>
  );
}
