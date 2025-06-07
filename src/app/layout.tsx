import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc-provider";
import { SessionProvider } from "next-auth/react";
import { SessionContextProvider } from "@/lib/session-context";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { GlobalPrefetch } from "@/components/global-prefetch";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EaseSubs - Same Subscriptions, Easier Prices | Save up to 80%",
  description:
    "Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services like Netflix, Spotify, Adobe Creative Cloud, and more.",
  keywords: [
    "cheap subscriptions",
    "discount subscriptions",
    "netflix discount",
    "spotify premium cheap",
    "adobe creative cloud discount",
    "subscription deals",
    "regional pricing",
    "streaming services discount",
  ],
  authors: [{ name: "EaseSubs Team" }],
  creator: "EaseSubs",
  publisher: "EaseSubs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://easesubs.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://easesubs.com",
    title: "EaseSubs - Same Subscriptions, Easier Prices",
    description:
      "Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services.",
    siteName: "EaseSubs",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EaseSubs - Discount Subscriptions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EaseSubs - Same Subscriptions, Easier Prices",
    description:
      "Save up to 80% on premium subscriptions like Netflix, Spotify, Adobe Creative Cloud, and more.",
    images: ["/og-image.jpg"],
    creator: "@easesubs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <meta name="theme-color" content="#9333EA" />
        <meta name="msapplication-TileColor" content="#9333EA" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <SessionContextProvider>
            <TRPCProvider>
              <GlobalPrefetch />
              {children}
              <CartSidebar />
            </TRPCProvider>
          </SessionContextProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
