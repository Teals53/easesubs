"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function RefundPolicyPage() {
  const policies = [
    {
      title: "Digital Products & Subscriptions",
      icon: CreditCard,
      timeframe: "14 days",
      content: [
        "Full refund available within 14 days of purchase for digital products",
        "Subscription refunds are prorated based on unused time",
        "Refunds are processed to the original payment method within 5-10 business days",
        "Monthly subscriptions can be cancelled at any time with no penalty",
      ],
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Auto-Renewal Cancellations",
      icon: Calendar,
      timeframe: "Anytime",
      content: [
        "Cancel auto-renewal at any time before the next billing cycle",
        "Access continues until the end of the current billing period",
        "No refund for the current billing period after 14 days",
        "Easy cancellation through your account dashboard",
      ],
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Special Circumstances",
      icon: CheckCircle,
      timeframe: "Case by case",
      content: [
        "Medical emergencies or extraordinary circumstances will be considered",
        "Technical issues preventing service use may qualify for refunds",
        "Duplicate charges will be refunded immediately upon verification",
        "Fraudulent charges will be investigated and refunded if confirmed",
      ],
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
  ];

  const nonRefundable = [
    "Services already rendered or consumed",
    "Downloadable content that has been accessed",
    "Custom or personalized services",
    "Promotional or discounted purchases (unless legally required)",
    "Purchases made using promotional codes or credits",
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
              <CreditCard className="h-12 w-12 text-purple-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Refund Policy
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
              Our Commitment to Customer Satisfaction
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We stand behind our products and services. This refund policy
              outlines the circumstances under which refunds may be requested
              and the process for obtaining them. We aim to be fair and
              transparent in all our refund decisions.
            </p>
          </motion.div>

          {/* Refund Categories */}
          <div className="space-y-8 mb-8">
            {policies.map((policy, index) => (
              <motion.div
                key={policy.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl border ${policy.borderColor} p-8`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-lg ${policy.bgColor} border ${policy.borderColor} mr-4`}
                    >
                      <policy.icon className={`h-6 w-6 ${policy.color}`} />
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      {policy.title}
                    </h2>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full ${policy.bgColor} ${policy.borderColor} border`}
                  >
                    <span className={`text-sm font-medium ${policy.color}`}>
                      {policy.timeframe}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {policy.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start text-gray-300"
                    >
                      <div
                        className={`w-2 h-2 ${policy.color.replace("text-", "bg-")} rounded-full mt-2 mr-3 flex-shrink-0`}
                      />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Non-Refundable Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mr-4">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              Non-Refundable Items
            </h2>
            <p className="text-gray-300 mb-6">
              The following items and services are generally not eligible for
              refunds:
            </p>
            <ul className="space-y-3">
              {nonRefundable.map((item, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Refund Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mr-4">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              How to Request a Refund
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Step-by-Step Process:
                </h3>
                <ol className="space-y-3">
                  <li className="flex items-start text-gray-300">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5 flex-shrink-0">
                      1
                    </span>
                    <span>
                      Contact our support team through the support portal
                    </span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5 flex-shrink-0">
                      2
                    </span>
                    <span>
                      Provide your order details and reason for refund
                    </span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5 flex-shrink-0">
                      3
                    </span>
                    <span>
                      We will review your request within 1-2 business days
                    </span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5 flex-shrink-0">
                      4
                    </span>
                    <span>
                      If approved, refund will be processed within 5-10 business
                      days
                    </span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Required Information:
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Order number or transaction ID</li>
                  <li>• Date of purchase</li>
                  <li>• Email address used for the purchase</li>
                  <li>• Detailed reason for the refund request</li>
                  <li>• Any relevant screenshots or documentation</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-semibold text-white">
                Need to Request a Refund?
              </h2>
            </div>
            <p className="text-gray-400 mb-6">
              Our support team is here to help with your refund request. We
              typically respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/support"
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Support Ticket
              </Link>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                View Your Orders
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

