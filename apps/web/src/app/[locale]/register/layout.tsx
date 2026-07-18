import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  path: "/register",
  noIndex: true,
});

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
