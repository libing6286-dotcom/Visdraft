import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
