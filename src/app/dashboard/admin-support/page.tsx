"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
} from "lucide-react";
import { trpc, invalidatePatterns } from "@/lib/trpc";
import { useState } from "react";
import { UserRole } from "@prisma/client";
import Link from "next/link";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "ADMIN";

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  const {
    data: ticketsData,
    isLoading,
    refetch,
  } = trpc.admin.getSupportTickets.useQuery(
    {
      search: searchTerm,
      status: statusFilter
        ? (statusFilter as "OPEN" | "IN_PROGRESS" | "CLOSED")
        : undefined,
      page,
      limit: itemsPerPage,
    },
    {
      enabled: isAdmin,
      // Refetch every 30 seconds for real-time updates
      refetchInterval: 30000,
    },
  );

  // Delete ticket mutation
  const deleteTicketMutation = trpc.admin.deleteTicket.useMutation({
    onSuccess: () => {
      // Invalidate all ticket-related queries for immediate update
      invalidatePatterns.tickets(utils);
      invalidatePatterns.dashboard(utils);
      // Refetch the tickets data to update the UI
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete ticket:", error);
      alert("Failed to delete ticket. Please try again.");
    },
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    redirect("/dashboard");
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const handleDeleteTicket = async (ticketId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this ticket? This action cannot be undone.",
      )
    ) {
      await deleteTicketMutation.mutateAsync({ ticketId });
    }
  };

  const totalPages = ticketsData
    ? Math.ceil(ticketsData.total / itemsPerPage)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
            Support Tickets Management
          </h1>
          <p className="text-gray-400">
            Manage customer support requests and tickets
          </p>
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
                {ticketsData?.tickets?.filter((t) => t.status === "OPEN")
                  .length || 0}
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
                {ticketsData?.tickets?.filter((t) => t.status === "IN_PROGRESS")
                  .length || 0}
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
                {ticketsData?.tickets?.filter((t) => t.status === "CLOSED")
                  .length || 0}
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
                {ticketsData?.total || 0}
              </p>
            </div>
            <MessageCircle className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tickets by subject, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        ) : !ticketsData?.tickets || ticketsData.tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No tickets found
            </h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter
                ? "Try adjusting your search or filter criteria"
                : "No support tickets have been created yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      Ticket
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      Customer
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      Priority
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      Created
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsData.tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">
                              {ticket.title}
                            </p>
                            <p className="text-gray-400 text-sm">
                              #{ticket.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">
                              {ticket.user?.name?.[0]?.toUpperCase() ||
                                ticket.user?.email?.[0]?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">
                              {ticket.user?.name || "Anonymous"}
                            </p>
                            <p className="text-gray-400 text-sm truncate">
                              {ticket.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white text-sm">
                          {formatDate(ticket.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/admin-support/${ticket.id}`}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            disabled={deleteTicketMutation.isPending}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Ticket"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {ticketsData.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-gray-700/30 rounded-xl p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <MessageCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {ticket.title}
                        </p>
                        <p className="text-gray-400 text-sm">
                          #{ticket.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Link
                        href={`/dashboard/admin-support/${ticket.id}`}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        disabled={deleteTicketMutation.isPending}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Ticket"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {ticket.user?.name?.[0]?.toUpperCase() ||
                          ticket.user?.email?.[0]?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">
                        {ticket.user?.name || "Anonymous"}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {ticket.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}
                      >
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {(page - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(page * itemsPerPage, ticketsData.total)} of{" "}
                  {ticketsData.total} tickets
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-white text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
