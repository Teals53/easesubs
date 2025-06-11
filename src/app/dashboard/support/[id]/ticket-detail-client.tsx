"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Clock,
  AlertCircle,
  XCircle,
  MessageCircle,
  RotateCcw,
  User,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TicketMessage {
  id: string;
  message: string;
  createdAt: string | Date;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

interface TicketDetailClientProps {
  ticketId: string;
}

export default function TicketDetailClient({
  ticketId,
}: TicketDetailClientProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: ticket,
    isLoading,
    refetch,
    isFetching,
  } = trpc.ticket.getById.useQuery(
    { id: ticketId },
    {
      enabled: !!ticketId,
      refetchInterval: 3000, // Auto-refresh every 3 seconds for more live chat
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchOnReconnect: true, // Refetch when reconnecting
    },
  );

  const addMessageMutation = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetch();
    },
    onError: () => {
      if (process.env.NODE_ENV === "development") {
        // console.error("Failed to send message:", error);
      }
      toast.error("Failed to send message. Please try again.");
    },
  });

  const closeTicketMutation = trpc.ticket.close.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const reopenTicketMutation = trpc.ticket.reopen.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addMessageMutation.mutateAsync({
        ticketId,
        message: newMessage.trim(),
      });
    } catch {
      if (process.env.NODE_ENV === "development") {
        // console.error("Failed to send message:", error);
      }
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "IN_PROGRESS":
        return "bg-blue-900/30 text-blue-400 border-blue-500/30";
      case "CLOSED":
        return "bg-gray-900/30 text-gray-400 border-gray-500/30";
      default:
        return "bg-purple-900/30 text-purple-400 border-purple-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-400";
      case "HIGH":
        return "text-orange-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "LOW":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "CLOSED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canAddMessage = ticket && !["CLOSED"].includes(ticket.status);
  const canCloseTicket = ticket && !["CLOSED"].includes(ticket.status);
  const canReopenTicket = ticket && ["CLOSED"].includes(ticket.status);

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
        <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Ticket Not Found
        </h2>
        <p className="text-gray-400 mb-6">
          The ticket you are looking for does not exist or you do not have
          permission to view it.
        </p>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          href="/dashboard/support"
          className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support
        </Link>
      </motion.div>

      {/* Ticket Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-3">
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-400">
                Ticket #{ticket.id.slice(-8)}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">
                Created {formatDate(new Date(ticket.createdAt))}
              </span>
              <span className="text-gray-600">•</span>
              <span
                className={`font-medium ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority} Priority
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">
                {ticket.category.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}
            >
              {getStatusIcon(ticket.status)}
              {ticket.status.replace("_", " ")}
            </span>

            {canCloseTicket && (
              <button
                onClick={() => closeTicketMutation.mutate({ id: ticketId })}
                disabled={closeTicketMutation.isPending}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white text-sm rounded-lg transition-colors"
              >
                {closeTicketMutation.isPending ? "Closing..." : "Close Ticket"}
              </button>
            )}

            {canReopenTicket && (
              <button
                onClick={() => reopenTicketMutation.mutate({ id: ticketId })}
                disabled={reopenTicketMutation.isPending}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                {reopenTicketMutation.isPending ? "Reopening..." : "Reopen"}
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <p className="text-gray-300 font-medium mb-2">Description:</p>
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation ({ticket.messages?.length || 0})
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-auto p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh conversation"
            >
              <RotateCcw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </h2>
        </div>

        <div className="max-h-96 overflow-y-auto p-6 space-y-4">
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((message: TicketMessage) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.user?.role === "ADMIN"
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.user?.role === "ADMIN"
                      ? "bg-purple-600"
                      : "bg-gray-600"
                  }`}
                >
                  {message.user?.role === "ADMIN" ? (
                    <Shield className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>

                <div
                  className={`flex-1 max-w-md ${
                    message.user?.role === "ADMIN" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl ${
                      message.user?.role === "ADMIN"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.message}</p>
                  </div>

                  <div
                    className={`mt-2 text-xs text-gray-500 ${
                      message.user?.role === "ADMIN"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <span className="font-medium">
                      {message.user?.role === "ADMIN"
                        ? "Support Team"
                        : message.user?.name || "You"}
                    </span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(new Date(message.createdAt))}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {canAddMessage && (
          <div className="p-6 border-t border-gray-700">
            <form onSubmit={handleSubmitMessage} className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    maxLength={5000}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      newMessage.length > 5000
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    <span
                      className={
                        newMessage.length > 4500 ? "text-yellow-400" : ""
                      }
                    >
                      {newMessage.length}
                    </span>
                    <span
                      className={newMessage.length > 5000 ? "text-red-400" : ""}
                    >
                      /5000
                    </span>
                  </div>
                </div>
                {newMessage.length > 5000 && (
                  <p className="text-red-400 text-xs mt-1">
                    Message cannot exceed 5000 characters
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={
                    !newMessage.trim() ||
                    newMessage.length > 5000 ||
                    isSubmitting
                  }
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        )}

        {!canAddMessage && (
          <div className="p-6 border-t border-gray-700 bg-gray-700/30">
            <p className="text-gray-400 text-center">
              This ticket is closed.{" "}
              {canReopenTicket &&
                "You can reopen it to continue the conversation."}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
