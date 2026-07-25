"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/loading-screen";

const CanvasPageClient = dynamic(() => import("./canvas-page-client"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export function CanvasPageLoader() {
  return <CanvasPageClient />;
}
