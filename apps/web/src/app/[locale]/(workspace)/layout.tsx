"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { CreditHeaderButton } from "@/components/credits/credit-header-button";
import { LoadingScreen } from "@/components/loading-screen";
import { PageTransition } from "@/components/page-transition";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("workspace.a11y");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] flex-col md:flex-row">
      {/* Skip navigation link -- visible only on keyboard focus for a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg"
      >
        {t("skipToContent")}
      </a>
      <AppSidebar />
      {/* pb-14 on mobile for the fixed bottom navigation bar, reset on md+ */}
      <main id="main" className="relative flex-1 overflow-auto pb-14 md:pb-0">
        {/* Top-right header credits button */}
        <div className="absolute right-4 top-3 z-10">
          <CreditHeaderButton />
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
