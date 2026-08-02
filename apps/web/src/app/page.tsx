import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LandingPage from "./[locale]/page";

import { Providers } from "@/components/providers";
import { defaultLocale } from "@/i18n/routing";
import { getLandingStructuredData, getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  namespace: "common.pages.landing",
  path: "/",
});

export default async function RootPage() {
  setRequestLocale(defaultLocale);

  return (
    <NextIntlClientProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getLandingStructuredData()),
        }}
      />
      <Providers>
        <LandingPage />
      </Providers>
    </NextIntlClientProvider>
  );
}
