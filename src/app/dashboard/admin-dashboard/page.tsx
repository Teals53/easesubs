"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Decimal } from "@prisma/client/runtime/library";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

function AdminStatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend = "up",
  changeText,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: "up" | "down" | "neutral";
  changeText?: string;
}) {
  const TrendIcon =
    trend === "up"
      ? ArrowUpRight
      : trend === "down"
        ? ArrowDownRight
        : Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          <div className="flex items-center mt-2">
            <TrendIcon
              className={`h-4 w-4 mr-1 ${
                trend === "up"
                  ? "text-green-400"
                  : trend === "down"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            />
            <p
              className={`text-sm ${
                trend === "up"
                  ? "text-green-400"
                  : trend === "down"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {change} {changeText}
            </p>
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "ADMIN";

  const {
    data: adminStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = trpc.admin.getDashboardStats.useQuery(undefined, {
    enabled: isAdmin,
    // Refresh dashboard stats every 30 seconds for real-time updates
    refetchInterval: 30 * 1000,
    // Ensure fresh data on mount
    staleTime: 0,
  });

  const {
    data: recentActivity,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = trpc.admin.getRecentActivity.useQuery(undefined, {
    enabled: isAdmin,
    // Refresh activity every 30 seconds
    refetchInterval: 30 * 1000,
    // Ensure fresh data on mount
    staleTime: 0,
  });

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchActivity()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // If not admin, redirect will be handled by middleware or layout
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Monitor your platform&apos;s performance and manage operations
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
        ) : (
          <>
            <AdminStatsCard
              title="Total Users"
              value={adminStats?.users.total.toString() || "0"}
              change={`+${adminStats?.users.newThisMonth || 0}`}
              changeText="this month"
              icon={Users}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              trend="up"
            />
            <AdminStatsCard
              title="Total Revenue"
              value={formatCurrency(Number(adminStats?.revenue.total || 0))}
              change={`+${formatCurrency(Number(adminStats?.revenue.monthly || 0))}`}
              changeText="this month"
              icon={DollarSign}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend="up"
            />
            <AdminStatsCard
              title="Total Orders"
              value={adminStats?.orders.total.toString() || "0"}
              change={`+${adminStats?.orders.thisMonth || 0}`}
              changeText="this month"
              icon={Package}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              trend="up"
            />
            <AdminStatsCard
              title="Support Tickets"
              value={adminStats?.tickets.open.toString() || "0"}
              change={`${adminStats?.tickets.total || 0} total`}
              changeText=""
              icon={Ticket}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              trend="neutral"
            />
          </>
        )}
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            System Overview
          </h3>

          {statsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Active Users</p>
                    <p className="text-gray-400 text-sm">
                      {adminStats?.users.total || 0} total users
                    </p>
                  </div>
                </div>
                <span className="text-blue-400 font-semibold">
                  {adminStats?.users.newThisMonth || 0} new
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Orders</p>
                    <p className="text-gray-400 text-sm">
                      {adminStats?.orders.total || 0} total orders
                    </p>
                  </div>
                </div>
                <span className="text-green-400 font-semibold">
                  {adminStats?.orders.thisMonth || 0} this month
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Support Tickets</p>
                    <p className="text-gray-400 text-sm">
                      {adminStats?.tickets.total || 0} total tickets
                    </p>
                  </div>
                </div>
                <span className="text-orange-400 font-semibold">
                  {adminStats?.tickets.open || 0} open
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Recent Activity
          </h3>

          {activityLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <div className="flex-1 h-4 bg-gray-600 rounded"></div>
                  <div className="w-16 h-3 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentActivity &&
            recentActivity.combinedActivities &&
            recentActivity.combinedActivities.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.combinedActivities.map((activity, index) => {
                if (activity.type === "order") {
                  const order = activity.data as {
                    id: string;
                    orderNumber: string;
                    total: Decimal;
                    createdAt: Date | string;
                  };
                  return (
                    <div
                      key={`activity-order-${order.id}-${index}`}
                      className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Package className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-300 text-sm flex-1">
                        New order #{order.orderNumber} -{" "}
                        {formatCurrency(Number(order.total || 0))}
                      </p>
                      <span className="text-gray-500 text-xs">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  );
                } else if (activity.type === "user") {
                  const user = activity.data as {
                    id: string;
                    name?: string | null;
                    email?: string | null;
                    createdAt: Date | string;
                  };
                  return (
                    <div
                      key={`activity-user-${user.id}-${index}`}
                      className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-300 text-sm flex-1">
                        New user registered: {user.name || user.email}
                      </p>
                      <span className="text-gray-500 text-xs">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  );
                } else if (activity.type === "ticket") {
                  const ticket = activity.data as {
                    id: string;
                    title: string;
                    createdAt: Date | string;
                  };
                  return (
                    <div
                      key={`activity-ticket-${ticket.id}-${index}`}
                      className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <Ticket className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-300 text-sm flex-1">
                        New ticket:{" "}
                        {ticket.title.length > 30
                          ? ticket.title.substring(0, 30) + "..."
                          : ticket.title}
                      </p>
                      <span className="text-gray-500 text-xs">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

