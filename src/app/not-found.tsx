"use client";

import { motion } from "framer-motion";
import { Search, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Script from "next/script";

export default function NotFound() {
  const router = useRouter();

  // Structured data for 404 page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Page Not Found - EaseSubs",
    description: "The requested page could not be found on EaseSubs. Browse our subscription deals instead.",
    url: "https://easesubs.com/404",
    mainEntity: {
      "@type": "WebSite",
      name: "EaseSubs",
      url: "https://easesubs.com",
    },
  };

  return (
    <>
      <Head>
        <title>Page Not Found (404) | EaseSubs</title>
        <meta name="description" content="The page you're looking for doesn't exist. Browse our premium subscription deals at discounted prices instead." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://easesubs.com/404" />
      </Head>

      <Script
        id="404-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto"
        >
          <motion.header
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-8xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full">
              <Search className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
          </motion.header>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
            <p className="text-gray-400 mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </section>

          <nav className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Go back
            </motion.button>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Go home
              </Link>
            </motion.div>
          </nav>

          <footer>
            <p className="text-gray-500 text-sm mb-4">
              Looking for something specific?
            </p>
            <nav className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/#products"
                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
              >
                Browse Products
              </Link>
              <span className="text-gray-600" aria-hidden="true">•</span>
              <Link
                href="/legal/privacy-policy"
                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-600" aria-hidden="true">•</span>
              <Link
                href="/legal/terms-of-service"
                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-gray-600" aria-hidden="true">•</span>
              <Link
                href="/auth/signin"
                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </footer>
        </motion.article>
      </main>
    </>
  );
}

