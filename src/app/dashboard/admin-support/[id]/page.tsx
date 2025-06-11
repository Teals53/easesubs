"use client";

import React, { useState } from "react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  Edit,
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { trpc, invalidatePatterns } from "@/lib/trpc";
import { toast } from "sonner";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface TicketMessage {
  id: string;
  message: string;
  createdAt: string | Date;
  isInternal: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const hasAccess = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPPORT_AGENT";

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  const ticketId = params.id as string;

  const {
    data: ticket,
    isLoading,
    refetch,
  } = trpc.admin.getTicketById.useQuery(
    { id: ticketId },
    {
      enabled: !!ticketId && hasAccess,
      // Refetch every 30 seconds for real-time updates
      refetchInterval: 30000,
    },
  );

  // Mutations
  const addMessageMutation = trpc.admin.addTicketMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      // Invalidate ticket-related queries
      invalidatePatterns.tickets(utils);
      refetch();
    },
    onError: () => {
      if (process.env.NODE_ENV === "development") {
        // console.error("Failed to add message:", error);
      }
      toast.error("Failed to add message. Please try again.");
    },
  });

  const updateStatusMutation = trpc.admin.updateTicketStatus.useMutation({
    onSuccess: () => {
      setEditingStatus(false);
      // Invalidate ticket-related queries
      invalidatePatterns.tickets(utils);
      invalidatePatterns.dashboard(utils);
      refetch();
    },
    onError: () => {
      if (process.env.NODE_ENV === "development") {
        // console.error("Failed to update status:", error);
      }
      toast.error("Failed to update ticket status. Please try again.");
    },
  });

  const deleteTicketMutation = trpc.admin.deleteTicket.useMutation({
    onSuccess: () => {
      // Invalidate ticket-related queries before redirecting
      invalidatePatterns.tickets(utils);
      invalidatePatterns.dashboard(utils);
      router.push("/dashboard/admin-support");
    },
    onError: () => {
      if (process.env.NODE_ENV === "development") {
        // console.error("Failed to delete ticket:", error);
      }
      toast.error("Failed to delete ticket. Please try again.");
    },
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session || !hasAccess) {
    redirect("/dashboard");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Ticket Not Found
        </h2>
        <p className="text-gray-400 mb-6">
          The ticket you are looking for does not exist.
        </p>
        <Link
          href="/dashboard/admin-support"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Support
        </Link>
      </div>
    );
  }

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addMessageMutation.mutateAsync({
      ticketId,
      message: newMessage,
      isInternal,
    });
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    await updateStatusMutation.mutateAsync({
      ticketId,
      status: newStatus as "OPEN" | "IN_PROGRESS" | "CLOSED",
    });
  };

  const handleDeleteTicket = async () => {
    if (
      confirm(
        "Are you sure you want to delete this ticket? This action cannot be undone.",
      )
    ) {
      await deleteTicketMutation.mutateAsync({ ticketId });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-400" />;
      case "OPEN":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "CLOSED":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <MessageCircle className="h-5 w-5 text-purple-400" />;
    }
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin-support"
          className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Support
        </Link>

        <button
          onClick={handleDeleteTicket}
          disabled={deleteTicketMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete Ticket</span>
        </button>
      </div>

      {/* Ticket Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
              {ticket.title}
            </h1>
            <p className="text-gray-400 mb-4 break-words">
              {ticket.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ID:</span>
                <span className="text-white font-mono text-xs md:text-sm">
                  #{ticket.id.slice(-8)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Category:</span>
                <span className="text-white text-xs md:text-sm">
                  {ticket.category.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Priority:</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Created:</span>
                <span className="text-white text-xs md:text-sm">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-4 lg:ml-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              {editingStatus ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[180px]"
                  >
                    <option value="">Select Status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>

                    <option value="CLOSED">Closed</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatusMutation.isPending}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingStatus(false);
                      setNewStatus("");
                    }}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(ticket.status)}`}
                  >
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace("_", " ")}
                  </span>
                  <button
                    onClick={() => {
                      setEditingStatus(true);
                      setNewStatus(ticket.status);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    title="Change Status"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">
                  {ticket.user?.name?.[0]?.toUpperCase() ||
                    ticket.user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              <div className="lg:text-right min-w-0">
                <p className="text-white font-medium truncate">
                  {ticket.user?.name || "Anonymous"}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {ticket.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Messages</h2>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((message: TicketMessage) => {
              const isAdmin = message.user?.role === "ADMIN";
              const isCurrentUser = message.user?.id === session?.user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-4 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                      isAdmin
                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                        : "bg-gradient-to-br from-blue-500 to-blue-600"
                    }`}
                  >
                    <span className="text-white text-sm font-bold">
                      {message.user?.name?.[0]?.toUpperCase() ||
                        message.user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>

                  <div
                    className={`flex-1 max-w-2xl ${isCurrentUser ? "text-right" : "text-left"}`}
                  >
                    <div
                      className={`inline-block p-4 rounded-2xl shadow-lg ${
                        isCurrentUser
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md border border-purple-500/30"
                          : "bg-gradient-to-br from-gray-700/80 to-gray-800/80 text-gray-100 rounded-bl-md border border-gray-600/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`font-semibold text-sm ${
                            isCurrentUser ? "text-purple-100" : "text-gray-200"
                          }`}
                        >
                          {message.user?.name || "Anonymous"}
                        </span>
                        {isAdmin && (
                          <span className="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-full border border-purple-400/30">
                            Admin
                          </span>
                        )}
                        {message.isInternal && (
                          <span className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full border border-blue-400/30">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed break-words">
                        {message.message}
                      </p>
                      <div
                        className={`text-xs mt-2 ${
                          isCurrentUser ? "text-purple-200" : "text-gray-400"
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Start the conversation by sending a message
              </p>
            </div>
          )}
        </div>

        {/* Add Message Form */}
        <div className="p-4 md:p-6 border-t border-gray-700 bg-gray-800/30">
          <form onSubmit={handleAddMessage} className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                />
                <span className="text-sm text-gray-300">
                  <span className="hidden sm:inline">
                    Internal message (not visible to customer)
                  </span>
                  <span className="sm:hidden">Internal</span>
                </span>
              </label>
            </div>

            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                maxLength={5000}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none pr-20 ${
                  newMessage.length > 5000
                    ? "border-red-500"
                    : "border-gray-600"
                }`}
              />
              <div className="absolute top-2 right-2 text-xs text-gray-400">
                <span
                  className={newMessage.length > 4500 ? "text-yellow-400" : ""}
                >
                  {newMessage.length}
                </span>
                <span
                  className={newMessage.length > 5000 ? "text-red-400" : ""}
                >
                  /5000
                </span>
              </div>
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  disabled={
                    !newMessage.trim() ||
                    newMessage.length > 5000 ||
                    addMessageMutation.isPending
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {addMessageMutation.isPending ? "Sending..." : "Send"}
                  </span>
                </button>
              </div>
            </div>
            {newMessage.length > 5000 && (
              <p className="text-red-400 text-xs mt-1">
                Message cannot exceed 5000 characters
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
