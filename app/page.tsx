"use client";

import dynamic from "next/dynamic";

const TarotApp = dynamic(() => import("@/components/TarotApp"), { ssr: false });

export default function Home() {
  return <TarotApp />;
}
