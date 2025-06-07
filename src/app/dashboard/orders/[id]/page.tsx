'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Download, 
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Package,
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const orderId = params.id as string
  const router = useRouter()

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined
  const isAdmin = user?.role === 'ADMIN'

  // Use admin API if user is admin, otherwise use regular user API
  const { data: order, isLoading } = isAdmin 
    ? trpc.admin.getOrderById.useQuery(
        { id: orderId },
        { enabled: !!orderId && isAdmin }
      )
    : trpc.order.getById.useQuery(
        { id: orderId },
        { enabled: !!orderId && !isAdmin }
      )

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-16 w-16 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold text-white">Order Not Found</h2>
        <p className="mt-2 text-gray-400">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          ← Go Back
        </button>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-6 w-6 text-green-400" />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-6 w-6 text-yellow-400" />
      case 'CANCELLED':
        return <XCircle className="h-6 w-6 text-red-400" />
      case 'FAILED':
        return <AlertTriangle className="h-6 w-6 text-red-400" />
      default:
        return <Package className="h-6 w-6 text-purple-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-900/30 text-green-400 border-green-500/30'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-900/30 text-red-400 border-red-500/30'
      default:
        return 'bg-purple-900/30 text-purple-400 border-purple-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Order Completed'
      case 'PENDING':
        return 'Payment Pending'
      case 'PROCESSING':
        return 'Processing Order'
      case 'CANCELLED':
        return 'Order Cancelled'
      case 'FAILED':
        return 'Payment Failed'
      default:
        return status
    }
  }

  // Get the latest payment and check if it has a payment URL
  const latestPayment = order.payments?.[0]
  const hasPaymentUrl = latestPayment?.providerData && 
    typeof latestPayment.providerData === 'object' && 
    latestPayment.providerData !== null &&
    'paymentUrl' in latestPayment.providerData && 
    latestPayment.providerData.paymentUrl

  // Check if order is pending and has payment URL
  const showPaymentButton = order.status === 'PENDING' && hasPaymentUrl
  const paymentUrl = hasPaymentUrl ? 
    (latestPayment.providerData as { paymentUrl: string }).paymentUrl : 
    null

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          href={isAdmin ? "/dashboard/admin-orders" : "/dashboard/orders"}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          {isAdmin ? "Back to Admin Orders" : "Back to Orders"}
        </Link>
      </motion.div>

      {/* Order Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Order #{order.orderNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>Order ID: {order.id}</span>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {isAdmin && (order as any).user && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Customer:</span>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <span>{(order as any).user.name || (order as any).user.email}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-medium">{getStatusText(order.status)}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(Number(order.total))}
              </div>
              <div className="text-sm text-gray-400">Total Amount</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Order Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Order Items</h2>
        </div>
        
        <div className="divide-y divide-gray-700">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {order.items.map((item: any) => (
            <div key={item.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.plan.product.name}</h3>
                    <p className="text-gray-400 text-sm">{item.plan.planType} Plan</p>
                    <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(Number(item.price))}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatCurrency(Number(item.price) / item.quantity)} each
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Order Summary & Payment Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Method</span>
              <span className="text-white">{order.paymentMethod || 'Credit Card'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Status</span>
              <span className={`${order.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'}`}>
                {order.status === 'COMPLETED' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID</span>
              <span className="text-white font-mono text-sm">{order.id.slice(-8)}</span>
            </div>
          </div>

          {/* Payment Action Button */}
          {showPaymentButton && (
            <button
              onClick={() => {
                if (paymentUrl) {
                  window.open(paymentUrl, '_blank')
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Complete Payment
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <CheckCircle className="h-4 w-4" />
              Payment Completed
            </button>
          )}

          {order.status === 'FAILED' && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <XCircle className="h-4 w-4" />
              Payment Failed
            </button>
          )}

          {order.status === 'CANCELLED' && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              <XCircle className="h-4 w-4" />
              Order Cancelled
            </button>
          )}

          {order.status === 'PROCESSING' && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Clock className="h-4 w-4" />
              Processing Payment
            </button>
          )}
        </motion.div>

        {/* Delivered Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Delivered Products
          </h3>
          
          {order.status === 'COMPLETED' ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.plan.product.name}</p>
                      <p className="text-gray-400 text-sm">{item.plan.planType} Plan</p>
                    </div>
                  </div>
                  <span className="text-green-400 text-sm font-medium">Delivered</span>
                </div>
              ))}
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  All products have been delivered to your account
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Products will be delivered after payment is completed
              </p>
              <div className="mt-4 space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                    <span className="text-gray-300 text-sm">{item.plan.product.name}</span>
                    <span className="text-yellow-400 text-sm">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Total Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Tax</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between text-white font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {order.status === 'COMPLETED' && (
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            <Download className="h-4 w-4" />
            Download Invoice
          </button>
        )}
      </motion.div>
    </div>
  )
} 