"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Header } from "@/components/layout/header";
import { Products } from "@/components/product/products";
import { WhyChooseUs } from "@/components/marketing/why-choose-us";
import { DiscordCTA } from "@/components/marketing/discord-cta";
import { Footer } from "@/components/layout/footer";
import { HomePageSchema } from "@/components/seo/schema-markup";


export default function HomePage() {
  const { data: session } = useSession();

  return (
    <>
      <HomePageSchema />
      <div className="min-h-screen bg-gray-950 overflow-x-hidden">
        <Header />

        {/* Hero Section */}
        <main>
          <section 
            className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden"
            aria-labelledby="hero-heading"
          >
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gray-950" aria-hidden="true">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-900/20 to-transparent"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-purple-900/20 to-transparent"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,60,190,0.15),transparent_40%)]"
              />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-10">
              <header className="flex flex-col items-center text-center max-w-4xl mx-auto">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex items-center justify-center mb-6"
                >
                  <motion.svg
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="text-purple-500 mr-3"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      d="M13 3L4 13H11L10 21L19 11H12L13 3Z"
                      fill="#9333EA"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                  <motion.h1 
                    id="hero-heading"
                    className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-100 bg-clip-text text-transparent"
                  >
                    EaseSubs.com
                  </motion.h1>
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-6 tracking-tight"
                >
                  Same subscriptions,{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    easier prices.
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="text-gray-300 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
                >
                  Get your favorite subscriptions at a fraction of the cost
                  through our legal regional pricing system. Save up to 80% on
                  premium services.
                </motion.p>

                <motion.nav
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-4"
                  aria-label="Hero navigation"
                >
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="#products"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg shadow-purple-600/30 transition-all duration-300 flex items-center justify-center"
                  >
                    Browse Subscriptions
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </motion.span>
                  </motion.a>

                  {!session?.user && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/auth/signin"
                        className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg shadow-gray-800/30 transition-all duration-300 flex items-center justify-center w-full"
                      >
                        Sign In / Register
                      </Link>
                    </motion.div>
                  )}
                </motion.nav>
              </header>
            </div>

            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute -bottom-16 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-gray-900"
              aria-hidden="true"
            />
          </section>

          {/* Products Section */}
          <section id="products" aria-labelledby="products-heading">
            <Products />
          </section>



          {/* Why Choose Us Section */}
          <section aria-labelledby="why-choose-us-heading">
            <WhyChooseUs />
          </section>

          {/* Discord CTA Section */}
          <section aria-labelledby="discord-cta-heading">
            <DiscordCTA />
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

