"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Search,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Ticket,
  Book,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { trpc, invalidatePatterns } from "@/lib/trpc";
import { sanitizeText } from "@/lib/input-sanitizer";

type TicketCategory =
  | "GENERAL"
  | "ORDER_ISSUES"
  | "PAYMENT_PROBLEMS"
  | "PRODUCT_QUESTIONS"
  | "TECHNICAL_SUPPORT"
  | "RETURNS_REFUNDS"
  | "ACCOUNT_ISSUES"
  | "BILLING_INQUIRIES";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export default function SupportClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter] = useState<TicketStatus | "">("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const TICKETS_PER_PAGE = 10;
  const [errorMessage, setErrorMessage] = useState<{
    type: "error" | "success";
    title: string;
    message: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }>({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
  });

  // Fetch tickets
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = trpc.ticket.getAll.useQuery(
    {
      limit: 100, // Fetch more for client-side pagination
      status: statusFilter || undefined,
    },
    {
      refetchInterval: 30000,
      staleTime: 10 * 1000,
    },
  );

  const allTickets = ticketsData?.tickets || [];

  // Filter tickets based on search query
  const filteredTickets = allTickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination calculations
  const totalTickets = filteredTickets.length;
  const totalPages = Math.ceil(totalTickets / TICKETS_PER_PAGE);
  const startIndex = (currentPage - 1) * TICKETS_PER_PAGE;
  const endIndex = startIndex + TICKETS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Fetch ticket stats
  const { data: stats, refetch: refetchStats } = trpc.ticket.getStats.useQuery(
    undefined,
    {
      refetchInterval: 30000,
      staleTime: 10 * 1000,
    },
  );

  // Create ticket mutation
  const createTicketMutation = trpc.ticket.create.useMutation({
    onSuccess: async () => {
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        category: "GENERAL",
        priority: "MEDIUM",
      });
      setErrorMessage({
        type: "success",
        title: "Success",
        message: "Support ticket created successfully!",
      });

      invalidatePatterns.tickets(utils);

      await Promise.all([refetchTickets(), refetchStats()]);
    },
    onError: (error) => {
      if (error.data?.zodError) {
        const fieldErrors = error.data.zodError.fieldErrors;
        const messages: string[] = [];

        if (fieldErrors.title) {
          messages.push(...fieldErrors.title);
        }
        if (fieldErrors.description) {
          messages.push(...fieldErrors.description);
        }

        setErrorMessage({
          type: "error",
          title: "Validation Error",
          message:
            messages.join(". ") || "Please check your input and try again.",
        });
      } else {
        setErrorMessage({
          type: "error",
          title: "Error",
          message:
            error.message || "Failed to create ticket. Please try again.",
        });
      }
    },
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);

    // Validation with character limits
    if (!formData.title.trim()) {
      setErrorMessage({
        type: "error",
        title: "Missing Information",
        message: "Please enter a ticket title.",
      });
      return;
    }

    if (formData.title.trim().length < 5) {
      setErrorMessage({
        type: "error",
        title: "Invalid Title",
        message: "Title must be at least 5 characters long.",
      });
      return;
    }

    if (formData.title.trim().length > 200) {
      setErrorMessage({
        type: "error",
        title: "Title Too Long",
        message: "Title must be less than 200 characters.",
      });
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage({
        type: "error",
        title: "Missing Information",
        message: "Please enter a description of your issue.",
      });
      return;
    }

    if (formData.description.trim().length < 10) {
      setErrorMessage({
        type: "error",
        title: "Invalid Description",
        message: "Description must be at least 10 characters long.",
      });
      return;
    }

    if (formData.description.trim().length > 5000) {
      setErrorMessage({
        type: "error",
        title: "Description Too Long",
        message: "Description must be less than 5000 characters.",
      });
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        title: sanitizeText(formData.title.trim()),
        description: sanitizeText(formData.description.trim()),
        category: formData.category,
        priority: formData.priority,
      });
    } catch {
      // Error handling is done in onError callback
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-900/30 text-blue-400 border-blue-500/30";
      case "OPEN":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "CLOSED":
        return "bg-green-900/30 text-green-400 border-green-500/30";
      default:
        return "bg-purple-900/30 text-purple-400 border-purple-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-900/30 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-900/30 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "LOW":
        return "bg-green-900/30 text-green-400 border-green-500/30";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-400" />;
      case "OPEN":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case "CLOSED":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <MessageCircle className="h-4 w-4 text-purple-400" />;
    }
  };

  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-4 rounded-lg border mb-6 ${
          errorMessage.type === "error"
            ? "bg-red-900/20 border-red-500/30 text-red-400"
            : "bg-green-900/20 border-green-500/30 text-green-400"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold mb-1">{errorMessage.title}</h4>
            <p className="text-sm opacity-90">{errorMessage.message}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-current opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
              Support Center
            </h1>
            <p className="text-gray-400">
              Get help with your account, orders, and technical issues
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Ticket
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">
                Open Tickets
              </p>
              <p className="text-2xl font-bold text-white">
                {stats?.openTickets || 0}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">In Progress</p>
              <p className="text-2xl font-bold text-white">
                {stats?.openTickets || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Closed</p>
              <p className="text-2xl font-bold text-white">
                {stats?.closedTickets || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">
                Total Tickets
              </p>
              <p className="text-2xl font-bold text-white">
                {stats?.totalTickets || 0}
              </p>
            </div>
            <MessageCircle className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </motion.div>

      {/* Quick Help & Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Quick Help */}
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Book className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Quick Help</h2>
            </div>
            <Link
              href="/dashboard/support/faq"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All FAQs →
            </Link>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard/support/faq"
              className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">
                How to place an order
              </h3>
              <p className="text-gray-400 text-sm">
                Learn how to browse and purchase subscriptions
              </p>
            </Link>
            <Link
              href="/dashboard/support/faq"
              className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">Payment & Billing</h3>
              <p className="text-gray-400 text-sm">
                Understanding payments, invoices, and refunds
              </p>
            </Link>
            <Link
              href="/dashboard/support/faq"
              className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">Delivery & Timing</h3>
              <p className="text-gray-400 text-sm">
                Understanding delivery methods and timeframes
              </p>
            </Link>
          </div>
        </div>

        {/* Contact Options */}
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center mb-4">
            <Mail className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Contact Us</h2>
          </div>
          <div className="space-y-4">
            <a
              href="https://discord.gg/QWbHNAq9Dw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/30 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-indigo-400 mr-3" />
              <div>
                <h3 className="text-white font-medium">Discord Support</h3>
                <p className="text-gray-400 text-sm">
                  Join our community for instant help
                </p>
              </div>
            </a>
            <a
              href="mailto:support@easesubs.com?subject=Support Request - EaseSubs"
              className="flex items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors cursor-pointer group"
            >
              <Mail className="w-6 h-6 text-gray-400 group-hover:text-purple-400 mr-3 transition-colors" />
              <div>
                <h3 className="text-white font-medium group-hover:text-purple-300 transition-colors">
                  Email Support
                </h3>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                  support@easesubs.com
                </p>
              </div>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search your tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Tickets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Your Support Tickets
          </h2>
        </div>

        {ticketsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        ) : !allTickets || allTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No tickets found
            </h3>
            <p className="text-gray-400 mb-6">
              You haven&apos;t created any support tickets yet.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-700">
              {paginatedTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className="block p-6 hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="text-white font-medium truncate">
                          {ticket.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>#{ticket.id.slice(-8)}</span>
                        <span>{ticket.category.replace("_", " ")}</span>
                        <span>{formatTimeAgo(new Date(ticket.createdAt))}</span>
                        <span>{ticket._count?.messages || 0} messages</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-lg p-4 rounded-2xl border border-gray-700 mt-6">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalTickets)}{" "}
                  of {totalTickets} tickets
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        const distance = Math.abs(page - currentPage);
                        return (
                          distance <= 2 || page === 1 || page === totalPages
                        );
                      })
                      .map((page, index, array) => {
                        const showEllipsis =
                          index > 0 && array[index - 1] !== page - 1;
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateForm(false);
              setErrorMessage(null);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Create Support Ticket
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setErrorMessage(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {renderErrorMessage()}

            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as TicketCategory,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ORDER_ISSUES">Order Issues</option>
                    <option value="PAYMENT_PROBLEMS">Payment Problems</option>
                    <option value="PRODUCT_QUESTIONS">Product Questions</option>
                    <option value="TECHNICAL_SUPPORT">Technical Support</option>
                    <option value="RETURNS_REFUNDS">Returns & Refunds</option>
                    <option value="ACCOUNT_ISSUES">Account Issues</option>
                    <option value="BILLING_INQUIRIES">Billing Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as TicketPriority,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  maxLength={5000}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrorMessage(null);
                  }}
                  className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition-colors flex items-center"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
