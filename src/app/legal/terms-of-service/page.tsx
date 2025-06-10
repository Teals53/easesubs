"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ScrollText,
  Users,
  CreditCard,
  Shield,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: ScrollText,
      content: [
        "By accessing and using our services, you accept and agree to be bound by these Terms of Service",
        "If you do not agree to these terms, you may not use our services",
        "We reserve the right to update these terms at any time",
        "Your continued use of our services constitutes acceptance of any changes",
      ],
    },
    {
      title: "User Accounts",
      icon: Users,
      content: [
        "You must provide accurate and complete information when creating an account",
        "You are responsible for maintaining the security of your account credentials",
        "You must notify us immediately of any unauthorized use of your account",
        "One person or entity may not maintain multiple accounts",
        "We reserve the right to suspend or terminate accounts that violate our &quot;Terms&quot; at our discretion",
      ],
    },
    {
      title: "Billing and Payments",
      icon: CreditCard,
      content: [
        "Subscription fees are billed in advance and are non-refundable except as required by law",
        "You authorize us to charge your chosen payment method for the subscription fees",
        "You are responsible for providing current and accurate billing information",
        "We reserve the right to change our pricing with 30 days notice",
        "Failure to pay may result in suspension or termination of your account",
      ],
    },
    {
      title: "Acceptable Use",
      icon: Shield,
      content: [
        "You may not use our services for any illegal or unauthorized purpose",
        "You may not violate any laws in your jurisdiction",
        "You may not transmit any harmful or malicious code",
        "You may not attempt to gain unauthorized access to our systems",
        "You may not interfere with or disrupt our services",
      ],
    },
    {
      title: "Intellectual Property",
      icon: AlertTriangle,
      content: [
        "Our services and content are protected by intellectual property laws",
        "You may not copy, modify, or distribute our content without permission",
        "All trademarks and service marks are property of their respective owners",
        "You retain ownership of content you create using our services",
        "We grant you a limited license to use our services for their intended purpose",
        "All content, including but not limited to text, graphics, logos, and software, is our property or our licensors&apos; property",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
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
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <ScrollText className="h-12 w-12 text-green-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Terms of Service
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
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              Agreement to Terms
            </h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of
              our website and services. Please read these terms carefully before
              using our services. By using our services, you agree to be bound
              by these terms.
            </p>
          </motion.div>

          {/* Main Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mr-4">
                    <section.icon className="h-6 w-6 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">
                    {section.title}
                  </h2>
                </div>

                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start text-gray-300"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Service Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mt-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">
              Service Availability
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Service Uptime:
                </h3>
                <p className="text-gray-300 mb-4">
                  We strive to maintain high service availability but cannot
                  guarantee 100% uptime. Planned maintenance will be announced
                  in advance when possible.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Modifications:
                </h3>
                <p className="text-gray-300">
                  We reserve the right to modify or discontinue our services at
                  any time, with or without notice, though we&apos;ll provide
                  reasonable advance notice when possible.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Limitation of Liability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mt-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mr-4">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              Limitation of Liability
            </h2>
            <p className="text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits or revenues, whether incurred
              directly or indirectly, or any loss of data, use, goodwill, or
              other intangible losses.
            </p>
          </motion.div>

          {/* Governing Law */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mt-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              Governing Law
            </h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which our company is incorporated,
              without regard to its conflict of law principles.
            </p>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mt-8 text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-semibold text-white">
                Questions About These Terms?
              </h2>
            </div>
            <p className="text-gray-400 mb-6">
              If you have any questions about these Terms of Service, please
              don&apos;t hesitate to contact us.
            </p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

