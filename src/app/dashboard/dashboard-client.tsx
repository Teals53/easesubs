"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { LucideIcon } from "lucide-react";
import { useCartStore } from "@/components/cart/cart-provider";

function StatsCard({
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
  icon: LucideIcon;
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

export default function DashboardClient() {
  const { data: session } = useSession();
  const { getTotalItems, isHydrated } = useCartStore();

  const { data: dashboardStats, isLoading: statsLoading } =
    trpc.user.getDashboardStats.useQuery(undefined, {
      enabled: !!session,
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome back, {session?.user?.name || "User"}!
        </h1>
        <p className="text-gray-400">
          Here&apos;s what&apos;s happening with your orders and subscriptions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
        ) : (
          <>
            <StatsCard
              title="Total Orders"
              value={dashboardStats?.totalOrders?.toString() || "0"}
              change={`${dashboardStats?.completedOrders || 0} completed`}
              changeText=""
              icon={Package}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              trend="neutral"
            />
            <StatsCard
              title="Monthly Savings"
              value={formatCurrency(
                Number(dashboardStats?.monthlySavings || 0),
              )}
              change="vs retail price"
              changeText=""
              icon={DollarSign}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend="up"
            />
            <StatsCard
              title="Monthly Spent"
              value={formatCurrency(Number(dashboardStats?.monthlySpent || 0))}
              change="this month"
              changeText=""
              icon={TrendingUp}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              trend="neutral"
            />
            <StatsCard
              title="Cart Items"
              value={(isHydrated ? getTotalItems() : 0).toString()}
              change="ready to checkout"
              changeText=""
              icon={ShoppingCart}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              trend="neutral"
            />
          </>
        )}
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Quick Actions
          </h3>
          <div className="space-y-4">
            <Link
              href="/checkout"
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <ShoppingCart className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-white font-semibold">Checkout</p>
                  <p className="text-gray-400 text-sm">
                    {isHydrated ? getTotalItems() : 0} items ready
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/"
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <Package className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-white font-semibold">Browse Products</p>
                  <p className="text-gray-400 text-sm">Find new deals</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/orders"
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                  <CreditCard className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-white font-semibold">Order History</p>
                  <p className="text-gray-400 text-sm">View all orders</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/profile-settings"
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                  <Calendar className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-white font-semibold">Profile Settings</p>
                  <p className="text-gray-400 text-sm">Update account</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity & Orders - Merged */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center group"
            >
              View All Orders
              <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {statsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0"></div>
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-3 bg-gray-600 rounded flex-shrink-0"></div>
                </div>
              ))}
            </div>
          ) : dashboardStats?.recentOrders &&
            dashboardStats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {dashboardStats.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {order.status || "Completed"} •{" "}
                      {formatCurrency(Number(order.total || 0))}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No recent activity</p>
              <p className="text-gray-500 text-sm">
                Your orders and activity will appear here
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
