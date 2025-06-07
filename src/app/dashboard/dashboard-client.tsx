'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Package, 
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { LucideIcon } from 'lucide-react'
import { useCartStore } from '@/components/cart/cart-provider'

function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  trend = 'up' 
}: {
  title: string
  value: string
  change: string
  icon: LucideIcon
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${color} p-6 rounded-2xl text-white relative overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <div className="flex items-center mt-2 text-white/70">
            <TrendIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">{change}</span>
          </div>
        </div>
        <Icon className="h-12 w-12 text-white/60" />
      </div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
    </motion.div>
  )
}

function LoadingCard() {
  return (
    <div className="animate-pulse bg-gray-800/50 p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-24"></div>
          <div className="h-8 bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-12 w-12 bg-gray-700 rounded"></div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const { data: session } = useSession()
  const { getTotalItems, isHydrated } = useCartStore()

  const { data: dashboardStats, isLoading: statsLoading } = trpc.user.getDashboardStats.useQuery(undefined, {
    enabled: !!session
  })
  const { data: recentActivity, isLoading: activityLoading } = trpc.user.getRecentActivity.useQuery(undefined, {
    enabled: !!session
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-bold text-white mb-2"
        >
          Welcome back, {session?.user?.name || 'User'}!
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          Here&apos;s what&apos;s happening with your orders
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))
        ) : (
          <>
            <StatsCard
              title="Total Orders"
              value={dashboardStats?.totalOrders?.toString() || '0'}
              change={`${dashboardStats?.totalOrders || 0} completed`}
              icon={Package}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              trend="neutral"
            />
            <StatsCard
              title="Monthly Savings"
              value={formatCurrency(Number(dashboardStats?.monthlySavings || 0))}
              change="vs retail price"
              icon={DollarSign}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend="up"
            />
            <StatsCard
              title="Monthly Spent"
              value={formatCurrency(Number(dashboardStats?.monthlySpent || 0))}
              change="this month"
              icon={TrendingUp}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              trend="neutral"
            />
            <StatsCard
              title="Cart Items"
              value={(isHydrated ? getTotalItems() : 0).toString()}
              change="ready to checkout"
              icon={ShoppingCart}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              trend="neutral"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-lg p-4 lg:p-6 rounded-2xl border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-white">Recent Orders</h2>
            <Link 
              href="/dashboard/orders" 
              className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center group"
            >
              View All
              <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          {statsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center p-3 lg:p-4 bg-gray-700/30 rounded-lg">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg mr-3 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="h-4 bg-gray-600 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardStats?.recentOrders && dashboardStats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {dashboardStats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 lg:p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">Order #{order.orderNumber}</p>
                      <p className="text-gray-400 text-sm truncate">
                        {order.status || 'Completed'} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-white font-semibold">{formatCurrency(Number(order.total || 0))}</p>
                    <p className="text-green-400 text-xs capitalize">{order.status?.toLowerCase() || 'completed'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No orders yet</p>
              <Link 
                href="/" 
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Browse products
              </Link>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-lg p-4 lg:p-6 rounded-2xl border border-gray-700"
        >
          <h2 className="text-lg lg:text-xl font-semibold text-white mb-4 lg:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <Link 
              href="/checkout" 
              className="p-3 lg:p-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl transition-all duration-200 group"
            >
              <ShoppingCart className="w-6 lg:w-8 h-6 lg:h-8 text-white mb-2 lg:mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm lg:text-base mb-1">Checkout</p>
              <p className="text-purple-200 text-xs">
                {isHydrated ? getTotalItems() : 0} items ready
              </p>
            </Link>
            
            <Link 
              href="/" 
              className="p-3 lg:p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 group"
            >
              <Package className="w-6 lg:w-8 h-6 lg:h-8 text-white mb-2 lg:mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm lg:text-base mb-1">Browse</p>
              <p className="text-blue-200 text-xs">Find new deals</p>
            </Link>
            
            <Link 
              href="/dashboard/orders" 
              className="p-3 lg:p-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 group"
            >
              <CreditCard className="w-6 lg:w-8 h-6 lg:h-8 text-white mb-2 lg:mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm lg:text-base mb-1">Orders</p>
              <p className="text-green-200 text-xs">View history</p>
            </Link>
            
            <Link 
              href="/dashboard/profile-settings" 
              className="p-3 lg:p-4 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 group"
            >
              <Calendar className="w-6 lg:w-8 h-6 lg:h-8 text-white mb-2 lg:mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm lg:text-base mb-1">Profile</p>
              <p className="text-gray-200 text-xs">Update account</p>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 lg:mt-8 bg-gray-800/50 backdrop-blur-lg p-4 lg:p-6 rounded-2xl border border-gray-700"
      >
        <h2 className="text-lg lg:text-xl font-semibold text-white mb-4 lg:mb-6">Recent Activity</h2>
        
        {activityLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                <div className="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0"></div>
                <div className="w-4 h-4 bg-gray-600 rounded flex-shrink-0"></div>
                <div className="flex-1 h-4 bg-gray-600 rounded min-w-0"></div>
                <div className="w-16 h-3 bg-gray-600 rounded flex-shrink-0"></div>
              </div>
            ))}
          </div>
        ) : recentActivity && recentActivity.recentOrders?.length > 0 ? (
          <div className="space-y-4">
            {/* Recent Orders */}
            {recentActivity.recentOrders?.slice(0, 4).map((order) => (
              <div key={order.id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-gray-300 text-sm flex-1 min-w-0 truncate">
                  Order #{order.orderNumber} completed - {formatCurrency(Number(order.total || 0))}
                </p>
                <span className="text-gray-500 text-xs flex-shrink-0">{formatDate(order.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No recent activity</p>
            <p className="text-gray-500 text-sm">Your activity will appear here as you use the platform</p>
          </div>
        )}
      </motion.div>
    </>
  )
} 