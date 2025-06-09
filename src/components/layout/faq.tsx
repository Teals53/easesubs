"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  Search,
  Clock,
  CreditCard,
  User,
  Settings,
} from "lucide-react";
import { sanitizeSearchQuery } from "@/lib/input-sanitizer";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category:
    | "general"
    | "orders"
    | "payments"
    | "account"
    | "delivery"
    | "technical";
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: "general-1",
    category: "general",
    question: "What is EaseSubs and how does it work?",
    answer:
      "EaseSubs is a subscription management platform that provides discounted access to premium subscription services like Spotify, Netflix, Duolingo, and more. We offer both account upgrades for your existing accounts and new subscription accounts at significantly reduced prices.",
  },
  {
    id: "general-2",
    category: "general",
    question: "Are the subscriptions legitimate and safe?",
    answer:
      "Yes, all our subscriptions are completely legitimate. We work with authorized resellers and use official upgrade methods. Your account security and privacy are our top priorities, and we never store your personal login credentials.",
  },
  {
    id: "general-3",
    category: "general",
    question:
      "What's the difference between 'Own Account Upgrade' and regular subscriptions?",
    answer:
      "Own Account Upgrade means we upgrade your existing account to premium status, so you keep all your playlists, preferences, and data. Regular subscriptions provide you with a new premium account. We recommend Own Account Upgrade for the best experience.",
  },

  // Order Questions
  {
    id: "orders-1",
    category: "orders",
    question: "How do I place an order?",
    answer:
      "Simply browse our products, select your desired subscription plan, add it to cart, and proceed to checkout. You'll need to create an account and provide the necessary information for account delivery or upgrade.",
  },
  {
    id: "orders-2",
    category: "orders",
    question: "How long does delivery take?",
    answer:
      "Delivery times vary by service: Manual delivery typically takes 1-24 hours, while automatic delivery is usually instant to 1 hour. You'll receive updates via email and can track your order status in your dashboard.",
  },
  {
    id: "orders-3",
    category: "orders",
    question: "What information do I need to provide for account upgrades?",
    answer:
      "For account upgrades, you'll typically need to provide your account email and sometimes temporary access. We never ask for passwords or personal information. Specific requirements are listed on each product page.",
  },
  {
    id: "orders-4",
    category: "orders",
    question: "Can I cancel or modify my order after placing it?",
    answer:
      "Orders can be cancelled within 10 minutes of placement if they haven't been processed yet. For modifications or cancellations after this time, please contact our support team immediately.",
  },

  // Payment Questions
  {
    id: "payments-1",
    category: "payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept cryptocurrency payments through Cryptomus (Bitcoin, Ethereum, USDT, and other major cryptocurrencies) and traditional payments through Stripe (credit/debit cards, PayPal).",
  },
  {
    id: "payments-2",
    category: "payments",
    question: "Is it safe to pay with cryptocurrency?",
    answer:
      "Yes, cryptocurrency payments are secure and often preferred for privacy. We use Cryptomus, a trusted payment processor, and all transactions are protected with advanced security measures.",
  },
  {
    id: "payments-3",
    category: "payments",
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer refunds within 24 hours of purchase if the service hasn't been delivered or if there are technical issues preventing delivery. Refunds for delivered services are evaluated case-by-case.",
  },
  {
    id: "payments-4",
    category: "payments",
    question: "Why are your prices so low compared to official prices?",
    answer:
      "We offer competitive pricing through bulk purchasing, partnerships with authorized resellers, and regional pricing strategies. All subscriptions are legitimate and come with the same features as official subscriptions.",
  },

  // Account Questions
  {
    id: "account-1",
    category: "account",
    question: "How do I access my purchased subscriptions?",
    answer:
      "All your purchased subscriptions are available in your dashboard under 'Orders'. You'll receive account details via email and can also access them anytime through your user panel.",
  },
  {
    id: "account-2",
    category: "account",
    question: "Can I share my subscription with family/friends?",
    answer:
      "This depends on the specific service's terms. Some services like Spotify Family and Netflix allow sharing, while others are for individual use only. Check the product description for sharing policies.",
  },
  {
    id: "account-3",
    category: "account",
    question: "What happens when my subscription expires?",
    answer:
      "We'll notify you before expiration. You can renew through your dashboard or purchase a new subscription. For Own Account Upgrades, your account will revert to the free tier with all your data intact.",
  },
  {
    id: "account-4",
    category: "account",
    question: "I forgot my password. How can I reset it?",
    answer:
      "Click 'Forgot Password' on the login page, enter your email, and follow the reset instructions. If you continue having issues, contact our support team.",
  },

  // Delivery Questions
  {
    id: "delivery-1",
    category: "delivery",
    question: "What's the difference between manual and automatic delivery?",
    answer:
      "Automatic delivery provides instant access through our automated systems, while manual delivery requires human processing and takes longer but often provides more personalized service and support.",
  },
  {
    id: "delivery-2",
    category: "delivery",
    question: "I haven't received my subscription details. What should I do?",
    answer:
      "First, check your spam/junk folder and your dashboard. If you still don't see the details after the estimated delivery time, create a support ticket and we'll investigate immediately.",
  },
  {
    id: "delivery-3",
    category: "delivery",
    question: "Can I get a replacement if my account stops working?",
    answer:
      "Yes, if your subscription stops working due to issues on our end within the service period, we'll provide a replacement or refund. Contact support with details about the issue.",
  },

  // Technical Questions
  {
    id: "technical-1",
    category: "technical",
    question: "I'm having trouble logging into the website. What should I do?",
    answer:
      "Try clearing your browser cache and cookies, or use an incognito/private browser window. If the issue persists, try a different browser or device. Contact support if problems continue.",
  },
  {
    id: "technical-2",
    category: "technical",
    question: "Is my personal information secure?",
    answer:
      "Absolutely. We use enterprise-grade security measures including encryption, secure servers, and strict data protection protocols. We never store sensitive information like passwords or full payment details.",
  },
  {
    id: "technical-3",
    category: "technical",
    question: "Do you have a mobile app?",
    answer:
      "Currently, we operate through our responsive website that works perfectly on mobile devices. We're considering a dedicated mobile app for the future based on user demand.",
  },
];

const categories = [
  { id: "general", label: "General", icon: HelpCircle },
  { id: "orders", label: "Orders & Delivery", icon: Clock },
  { id: "payments", label: "Payments & Billing", icon: CreditCard },
  { id: "account", label: "Account Management", icon: User },
  { id: "technical", label: "Technical Support", icon: Settings },
];

interface FAQProps {
  maxItems?: number;
  showSearch?: boolean;
}

export function FAQ({ maxItems, showSearch = true }: FAQProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const handleSearchChange = (value: string) => {
    try {
      const sanitizedQuery = sanitizeSearchQuery(value);
      setSearchQuery(sanitizedQuery);
    } catch {
      // If sanitization fails, use empty string
      setSearchQuery("");
    }
  };

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full">
      {/* Search Bar */}
      {showSearch && (
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Categories with Questions */}
      <div className="space-y-8">
        {categories.map((category, categoryIndex) => {
          const categoryFAQs = filteredFAQs.filter(
            (faq) => faq.category === category.id,
          );

          if (categoryFAQs.length === 0) return null;

          const displayedFAQs = maxItems
            ? categoryFAQs.slice(0, Math.ceil(maxItems / categories.length))
            : categoryFAQs;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-2xl overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border-b border-gray-700/50 p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-600/20 p-2 rounded-lg">
                    <category.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {category.label}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {categoryFAQs.length} questions
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions in Category */}
              <div className="p-6 space-y-4">
                {displayedFAQs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                    className="bg-gray-700/30 backdrop-blur-lg border border-gray-600/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-600/20 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                        <h3 className="text-white font-medium">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          openItems.has(faq.id) ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {openItems.has(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 ml-7">
                            <p className="text-gray-300 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No FAQs found
            </h3>
            <p className="text-gray-400">
              No frequently asked questions match your search. Try different
              keywords.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
