"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  Database,
  Globe,
  Mail,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: [
        "Personal information such as name, email address, and contact details when you create an account",
        "Payment information processed securely through our payment providers",
        "Usage data including how you interact with our services",
        "Technical information such as IP address, browser type, and device information",
        "Communication data when you contact our support team",
      ],
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      content: [
        "To provide and maintain our services",
        "To process payments and manage subscriptions",
        "To communicate with you about your account and our services",
        "To improve our services and develop new features",
        "To ensure security and prevent fraud",
        "To comply with legal obligations",
      ],
    },
    {
      title: "Information Sharing",
      icon: Globe,
      content: [
        "We do not sell, trade, or rent your personal information to third parties",
        "We may share information with trusted service providers who assist in our operations",
        "Information may be disclosed if required by law or to protect our rights",
        "Anonymized data may be used for analytics and research purposes",
      ],
    },
    {
      title: "Data Security",
      icon: Lock,
      content: [
        "We implement industry-standard security measures to protect your data",
        "All payment information is processed using secure encryption",
        "Regular security audits and updates to our systems",
        "Limited access to personal information on a need-to-know basis",
        "Secure data storage with backup and recovery procedures",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/legal"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Legal
            </Link>
          </motion.nav>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-blue-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Privacy Policy
              </h1>
            </div>
            <p className="text-xl text-gray-400">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.header>

          {/* Introduction */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              Our Commitment to Your Privacy
            </h2>
            <p className="text-gray-300 leading-relaxed">
              At EaseSubs, we are committed to protecting your privacy and
              ensuring the security of your personal information. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our services.
            </p>
          </motion.section>

          {/* Main Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8"
              >
                <header className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mr-4">
                    <section.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">
                    {section.title}
                  </h2>
                </header>

                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start text-gray-300"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>

          {/* Your Rights */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mt-8"
          >
            <header className="mb-6 flex items-center">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mr-4">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Your Rights</h2>
            </header>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  You have the right to:
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Access your personal information</li>
                  <li>• Correct inaccurate data</li>
                  <li>• Request deletion of your data</li>
                  <li>• Withdraw consent</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Data Retention:
                </h3>
                <p className="text-gray-300">
                  We retain your information only as long as necessary to
                  provide our services and comply with legal obligations.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mt-8 text-center"
          >
            <header className="flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-semibold text-white">
                Questions About This Policy?
              </h2>
            </header>
            <p className="text-gray-400 mb-6">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us.
            </p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
