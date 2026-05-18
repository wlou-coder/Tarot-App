import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Oracle · Tarot",
  description: "A mystical tarot experience guided by hand gestures",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden bg-black">{children}</body>
    </html>
  );
}
