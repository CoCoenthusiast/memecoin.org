import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/hooks/useSession";
import { LayoutClient } from "@/components/LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://degenscult.vercel.app"),
  title: "degenscult",
  description: "Community forum for memecoin discussion and trading culture",
  applicationName: "degenscult",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "degenscult",
    title: "degenscult",
    description: "Community forum for memecoin discussion and trading culture",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "degenscult" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "degenscult",
    description: "Community forum for memecoin discussion and trading culture",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "degenscult" }],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <SessionProvider>
          <LayoutClient>{children}</LayoutClient>
        </SessionProvider>
      </body>
    </html>
  );
}
