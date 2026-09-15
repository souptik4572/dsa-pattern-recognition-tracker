import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: { default: "Pattern Tracker", template: "%s · Pattern Tracker" },
  description:
    "Track DSA practice by pattern: 129 named patterns across 22 families and 812 curated LeetCode problems.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
