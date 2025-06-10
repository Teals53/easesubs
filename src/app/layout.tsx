import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc-provider";
import { SessionProvider } from "next-auth/react";
import { SessionContextProvider } from "@/lib/session-context";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { AdvancedSEO } from "@/components/seo/advanced-seo";
import { ResourceHints } from "@/components/seo/performance-seo";
import { ECommerceSchema, SubscriptionServiceSchema } from "@/components/seo/local-business-schema";
import { ServerNonceProvider } from "@/components/seo/nonce-provider";
import { NonceAwareScripts } from "@/components/seo/nonce-aware-scripts";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#9333EA' },
    { media: '(prefers-color-scheme: light)', color: '#9333EA' }
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://easesubs.com"),
  title: {
    default: "EaseSubs - Same Subscriptions, Easier Prices | Save up to 80%",
    template: "%s | EaseSubs",
  },
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
    "subscription marketplace",
    "premium accounts",
    "digital subscriptions",
  ],
  authors: [{ name: "EaseSubs Team", url: "https://easesubs.com" }],
  creator: "EaseSubs",
  publisher: "EaseSubs",
  applicationName: "EaseSubs",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  classification: "E-commerce, Subscription Services",
  category: "Shopping",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      'en-US': '/en-US',
      'en': '/en',
    },
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
        alt: "EaseSubs - Discount Subscriptions Platform",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EaseSubs - Same Subscriptions, Easier Prices",
    description:
      "Save up to 80% on premium subscriptions like Netflix, Spotify, Adobe Creative Cloud, and more.",
    images: [
      {
        url: "/og-image.jpg",
        alt: "EaseSubs - Discount Subscriptions Platform",
      },
    ],
    creator: "@easesubs",
    site: "@easesubs",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
    other: {
      "msvalidate.01": "your-bing-verification-code",
    },
  },
  appleWebApp: {
    capable: true,
    title: "EaseSubs",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#9333EA",
    "msapplication-TileImage": "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <ResourceHints />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-950 text-white`}
        suppressHydrationWarning
      >
        {/* Skip Navigation Links */}
        <div className="sr-only focus-within:not-sr-only">
          <a
            href="#main-content"
            className="fixed top-4 left-4 z-[9999] bg-purple-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Skip to main content
          </a>
          <a
            href="#navigation"
            className="fixed top-4 left-40 z-[9999] bg-purple-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Skip to navigation
          </a>
        </div>

        <ServerNonceProvider>
          <AdvancedSEO>
            <ECommerceSchema />
            <SubscriptionServiceSchema />
            <NonceAwareScripts />
            <TRPCProvider>
              <SessionProvider>
                <SessionContextProvider>
                  <Toaster 
                    position="top-right" 
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#1f2937',
                        color: '#ffffff',
                        border: '1px solid #374151',
                      },
                    }}
                  />
                  <main id="main-content" role="main">
                    {children}
                  </main>
                  <CartSidebar />
                </SessionContextProvider>
              </SessionProvider>
            </TRPCProvider>
          </AdvancedSEO>
        </ServerNonceProvider>
      </body>
    </html>
  );
}

