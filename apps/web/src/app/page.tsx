import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LandingPage from "./[locale]/page";

import { Providers } from "@/components/providers";
import { defaultLocale } from "@/i18n/routing";
import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  namespace: "common.pages.landing",
  path: "/",
});

export default async function RootPage() {
  setRequestLocale(defaultLocale);

  return (
    <NextIntlClientProvider>
      <Providers>
        <LandingPage />
      </Providers>
    </NextIntlClientProvider>
  );
}
