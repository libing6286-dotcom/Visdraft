import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  namespace: "common.pages.pricing",
  path: "/pricing",
});

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
