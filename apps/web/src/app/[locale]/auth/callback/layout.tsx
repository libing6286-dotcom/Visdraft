import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  path: "/auth/callback",
  noIndex: true,
});

export default function AuthCallbackLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
