"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  CreditCard,
  Calendar,
  ArrowUpRight,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import ReviewableItems from "@/components/dashboard/ReviewableItems";

interface OrderPlan {
  product: {
    name: string;
    logoUrl?: string | null;
  };
  planType: string;
}

interface OrderItem {
  id: string;
  price: { toString(): string } | string | number;
  quantity: number;
  plan: OrderPlan;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date | string;
  total: { toString(): string } | string | number;
  status: string;
  paymentMethod?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = trpc.order.getAll.useQuery(
    {
      limit: 50,
      status:
        statusFilter === ""
          ? undefined
          : (statusFilter as
              | "PENDING"
              | "PROCESSING"
              | "COMPLETED"
              | "CANCELLED"
              | "FAILED"),
    },
  );

  // Fetch order stats
  const { data: orderStats } = trpc.order.getStats.useQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "PENDING":
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "FAILED":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Package className="h-4 w-4 text-purple-400" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900/30 text-green-400";
      case "PENDING":
      case "PROCESSING":
        return "bg-yellow-900/30 text-yellow-400";
      case "CANCELLED":
      case "FAILED":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-purple-900/30 text-purple-400";
    }
  };

  const filteredOrders =
    orders?.orders?.filter(
      (order: Order) =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item: OrderItem) =>
          item.plan.product.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        ),
    ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Order History
          </h1>
          <p className="text-gray-400">
            Track and manage your subscription orders
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Order Stats */}
      {orderStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-gray-800/50 p-3 lg:p-4 rounded-xl border border-gray-700">
            <div className="text-xl lg:text-2xl font-bold text-white">
              {orderStats.totalOrders}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">Total Orders</div>
          </div>
          <div className="bg-gray-800/50 p-3 lg:p-4 rounded-xl border border-gray-700">
            <div className="text-xl lg:text-2xl font-bold text-yellow-400">
              {orderStats.pendingOrders}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">
              Pending Orders
            </div>
          </div>
          <div className="bg-gray-800/50 p-3 lg:p-4 rounded-xl border border-gray-700">
            <div className="text-xl lg:text-2xl font-bold text-green-400">
              {orderStats.completedOrders}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">
              Completed Orders
            </div>
          </div>
          <div className="bg-gray-800/50 p-3 lg:p-4 rounded-xl border border-gray-700">
            <div className="text-lg lg:text-2xl font-bold text-purple-400">
              {formatCurrency(Number(orderStats.totalSpent))}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">Total Spent</div>
          </div>
        </div>
      )}

      {/* Reviewable Items */}
      <ReviewableItems />

      {/* Orders List */}
      {ordersLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700 animate-pulse"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-600 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 bg-gray-600 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))
      ) : filteredOrders.length > 0 ? (
        filteredOrders.map((order: Order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {formatCurrency(Number(order.total))}
                </div>
                <div
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}
                >
                  {getOrderStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2 mb-4">
              {order.items.map((item: OrderItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {item.plan.product.logoUrl ? (
                      <Image
                        src={item.plan.product.logoUrl}
                        alt={item.plan.product.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback =
                            target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "inline-block";
                        }}
                        unoptimized
                      />
                    ) : null}
                    {!item.plan.product.logoUrl && (
                      <Package className="w-6 h-6 text-purple-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {item.plan.product.name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {item.plan.planType} Plan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {formatCurrency(Number(item.price))}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                {order.paymentMethod && (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>{order.paymentMethod}</span>
                  </>
                )}
              </div>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No orders found
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || statusFilter
              ? "Try adjusting your search or filter criteria"
              : "You haven't placed any orders yet"}
          </p>
          {!searchQuery && !statusFilter && (
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Browse Products
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
