import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";
import { WorkspaceLayoutClient } from "./workspace-layout-client";

export const generateMetadata = getMetadata({
  noIndex: true,
});

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <WorkspaceLayoutClient>{children}</WorkspaceLayoutClient>;
}
