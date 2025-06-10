"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Shield,
  ScrollText,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const legalPages = [
  {
    title: "Privacy Policy",
    description:
      "Learn how we collect, use, and protect your personal information.",
    icon: Shield,
    href: "/legal/privacy-policy",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    title: "Terms of Service",
    description: "Understand the terms and conditions for using our services.",
    icon: ScrollText,
    href: "/legal/terms-of-service",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    title: "Refund Policy",
    description: "Information about our refund and cancellation policies.",
    icon: CreditCard,
    href: "/legal/refund-policy",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-purple-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Legal Information
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Transparency is important to us. Review our legal documents to
              understand your rights and our commitments.
            </p>
          </motion.div>

          {/* Legal Documents Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {legalPages.map((page, index) => (
              <motion.div
                key={page.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={page.href}
                  className={`block p-8 rounded-2xl border ${page.borderColor} ${page.bgColor} backdrop-blur-lg hover:scale-105 transition-all duration-300 group`}
                >
                  <div className="flex items-center mb-4">
                    <div
                      className={`p-3 rounded-lg ${page.bgColor} ${page.borderColor} border`}
                    >
                      <page.icon className={`h-6 w-6 ${page.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {page.title}
                  </h3>

                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {page.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 text-center"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              Questions About Our Legal Policies?
            </h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              If you have any questions about our legal documents or need
              clarification on any terms, our support team is here to help.
            </p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

