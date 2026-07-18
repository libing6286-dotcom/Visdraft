import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  namespace: "common.pages.home",
  path: "/home",
  noIndex: true,
});

export default function HomeLayout({ children }: { children: ReactNode }) {
  return children;
}
