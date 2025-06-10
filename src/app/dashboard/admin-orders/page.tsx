"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit3,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const itemsPerPage = 10;

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "ADMIN";

  const {
    data: orders,
    isLoading,
    refetch,
  } = trpc.admin.getOrders.useQuery(
    {
      status:
        statusFilter === "all" || statusFilter === ""
          ? undefined
          : (statusFilter as
              | "PENDING"
              | "PROCESSING"
              | "COMPLETED"
              | "CANCELLED"),
      search: searchTerm || undefined,
      page,
      limit: itemsPerPage,
    },
    {
      enabled: isAdmin,
    },
  );

  // Update order status mutation
  const updateOrderMutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedOrder(null);
      setNewStatus("");
    },
    onError: () => {
      toast.error("Failed to update order status");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "PROCESSING":
        return <RefreshCw className="h-4 w-4 text-blue-400" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "CANCELLED":
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default:
        return <Package className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900/30 text-green-400";
      case "PENDING":
        return "bg-yellow-900/30 text-yellow-400";
      case "PROCESSING":
        return "bg-blue-900/30 text-blue-400";
      case "FAILED":
        return "bg-red-900/30 text-red-400";
      case "CANCELLED":
        return "bg-gray-900/30 text-gray-400";
      default:
        return "bg-blue-900/30 text-blue-400";
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderMutation.mutateAsync({
        orderId,
        status: status as
          | "PENDING"
          | "PROCESSING"
          | "COMPLETED"
          | "CANCELLED"
          | "FAILED",
      });
    } catch {
      // Error handling is done by the mutation onError callback
    }
  };

  const totalPages = orders ? Math.ceil(orders.total / itemsPerPage) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
            Order Management
          </h1>
          <p className="text-gray-400">Monitor and manage customer orders</p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Order
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Customer
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Amount
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Date
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-700">
                      <td className="py-4 px-6">
                        <div className="animate-pulse h-4 bg-gray-700 rounded w-24"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="animate-pulse flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-32"></div>
                            <div className="h-3 bg-gray-700 rounded w-24"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="animate-pulse h-4 bg-gray-700 rounded w-20"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="animate-pulse h-6 bg-gray-700 rounded w-16"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="animate-pulse h-4 bg-gray-700 rounded w-24"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="animate-pulse h-8 w-8 bg-gray-700 rounded"></div>
                      </td>
                    </tr>
                  ))
                : orders?.orders?.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-purple-400" />
                          <div>
                            <p className="text-white font-medium">
                              #{order.orderNumber}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {order.items?.length || 0} items
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {order.user?.name?.[0]?.toUpperCase() ||
                                order.user?.email?.[0]?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {order.user?.name || "Anonymous"}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {order.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-400 mr-1" />
                          <span className="text-white font-semibold">
                            {formatCurrency(Number(order.total))}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="h-4 w-4 text-white" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedOrder(order.id);
                              setNewStatus(order.status);
                            }}
                            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                            title="Update Status"
                          >
                            <Edit3 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {orders && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * itemsPerPage + 1} to{" "}
              {Math.min(page * itemsPerPage, orders.total)} of {orders.total}{" "}
              orders
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="text-white text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedOrder(null);
              setNewStatus("");
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Update Order Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleStatusUpdate(selectedOrder, newStatus)}
                  disabled={updateOrderMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {updateOrderMutation.isPending
                    ? "Updating..."
                    : "Update Status"}
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setNewStatus("");
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
