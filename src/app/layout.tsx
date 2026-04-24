import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { jcBrandConfig } from "@/modules/shared/branding/brand.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${jcBrandConfig.app.name} - ${jcBrandConfig.app.productName}`,
    template: `%s | ${jcBrandConfig.app.name}`,
  },
  description: jcBrandConfig.app.description,
  metadataBase: new URL(jcBrandConfig.links.website),
  openGraph: {
    title: `${jcBrandConfig.app.name} - ${jcBrandConfig.app.productName}`,
    description: jcBrandConfig.app.description,
    url: jcBrandConfig.links.website,
    siteName: jcBrandConfig.app.name,
    images: [
      {
        url: jcBrandConfig.assets.ogImage,
        width: 1200,
        height: 630,
        alt: `${jcBrandConfig.app.name} preview`,
      },
    ],
    type: "website",
    locale: "es_CO",
  },
  icons: {
    icon: [
      { url: jcBrandConfig.assets.favicon, sizes: "32x32" },
      { url: jcBrandConfig.assets.logoMark, sizes: "192x192", type: "image/png" },
    ],
    shortcut: jcBrandConfig.assets.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
