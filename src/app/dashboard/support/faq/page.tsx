"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Users, HelpCircle } from "lucide-react";
import Link from "next/link";
import { FAQ } from "@/components/layout/faq";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <Link
          href="/dashboard/support"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Support
        </Link>
      </motion.div>

      {/* Simple Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-4"
        >
          <HelpCircle className="w-8 h-8 text-purple-400 mr-3" />
          <h1 className="text-3xl font-bold text-white">
            Frequently Asked Questions
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          Find answers to common questions about EaseSubs.
        </motion.p>
      </div>

      {/* FAQ Content */}
      <div className="max-w-6xl mx-auto pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FAQ />
        </motion.div>

        {/* Enhanced Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-purple-600/20 p-3 rounded-full">
                  <MessageCircle className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-4">
                Still need help?
              </h3>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Couldn&apos;t find what you were looking for? Our dedicated
                support team is ready to assist you with personalized help for
                any questions or issues.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Link
                  href="/dashboard/support"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <MessageCircle className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Create Support Ticket
                </Link>
                <a
                  href="https://discord.gg/QWbHNAq9Dw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

