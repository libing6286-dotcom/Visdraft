import type { ReactNode } from "react";

import { getMetadata } from "@/lib/seo";

export const generateMetadata = getMetadata({
  namespace: "common.pages.productPhotoToAdCreative",
  path: "/product-photo-to-ad-creative",
});

export default function ProductPhotoToAdCreativeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
