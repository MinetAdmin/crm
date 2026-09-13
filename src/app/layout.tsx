import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter_Tight } from "next/font/google";

import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRM · Minet Uganda",
  description:
    "Business Development console for Minet Uganda: leads, pipeline, initiatives, tenders and the forecast derived from them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
