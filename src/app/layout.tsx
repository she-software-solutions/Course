import type { Metadata, Viewport } from "next";
import { Cinzel, Geist } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { site } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.shortName} — Online Courses by ${site.name}`, template: `%s | ${site.shortName}` },
  description: site.description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: `${site.shortName} — Online Courses by ${site.name}`,
    description: site.description,
    siteName: site.name,
    images: ["/brand/logo-round-light.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#120c18" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${cinzel.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
