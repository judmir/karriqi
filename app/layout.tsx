import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Karriqi", template: "%s · Karriqi" },
  description:
    "Mobile-first family app foundation — modules and data come in later phases.",
  applicationName: "Karriqi",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/karriqi-pwa-logo.svg", type: "image/svg+xml" },
      {
        url: "/icons/karriqi-pwa-logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/karriqi-pwa-logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/icons/karriqi-pwa-logo-180.png",
  },
  appleWebApp: {
    capable: true,
    title: "Karriqi",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0f11",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${outfitSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
