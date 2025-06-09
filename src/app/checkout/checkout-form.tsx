"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  ExternalLink,
  ShieldCheck,
  Settings,
  AlertTriangle,
  CheckCircle,
  X,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart/use-cart";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { trpc } from "@/lib/trpc";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface ErrorMessage {
  type: "error" | "success" | "warning";
  title: string;
  message: string;
}

export function CheckoutForm() {
  const { data: session } = useSession();
  const { items, totalPrice, clearCart, removeItem, updateQuantity } =
    useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error parameters from payment redirects
  const errorParam = searchParams.get('error');
  if (errorParam && !errorMessage) {
    let errorTitle = "Payment Error";
    let errorDescription = "An error occurred during payment processing.";
    
    switch (errorParam) {
      case 'configuration':
        errorTitle = "Configuration Error";
        errorDescription = "Payment system is not properly configured. Please contact support.";
        break;
      case 'payment_failed':
        errorTitle = "Payment Failed";
        errorDescription = "Your payment could not be processed. Please try again.";
        break;
      case 'payment_not_found':
        errorTitle = "Payment Not Found";
        errorDescription = "Payment record could not be found. Please try creating a new order.";
        break;
      case 'database_error':
        errorTitle = "System Error";
        errorDescription = "A system error occurred. Please try again or contact support.";
        break;
      case 'server_error':
        errorTitle = "Server Error";
        errorDescription = "An internal server error occurred. Please try again later.";
        break;
      case 'missing_token':
        errorTitle = "Invalid Payment";
        errorDescription = "Payment verification failed. Please try again.";
        break;
      default:
        errorTitle = "Unknown Error";
        errorDescription = "An unknown error occurred during payment.";
    }
    
    setErrorMessage({
      type: "error",
      title: errorTitle,
      message: errorDescription,
    });
    
    // Clear the error parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('error');
    window.history.replaceState({}, '', newUrl.toString());
  }

  // Check if user is admin
  const isAdmin = session?.user?.role === "ADMIN";

  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: async (data) => {
      if (selectedPayment === "iyzico") {
        // Handle Iyzico payment - create payment session and redirect
        try {
          await handleIyzicoPayment(data.orderId);
        } catch (error) {
          console.error("Iyzico payment failed:", error);
          setIsProcessing(false);
          setErrorMessage({
            type: "error",
            title: "Payment Error",
            message: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
          });
        }
      } else {
        setIsProcessing(false);
        setErrorMessage({
          type: "success",
          title: "Order Created Successfully",
          message:
            "Your order has been created and you will be redirected to view it.",
        });

        // Redirect to the order details page
        setTimeout(() => {
          router.push(data.redirectUrl || `/dashboard/orders/${data.orderId}`);
        }, 1500);
      }
    },
    onError: (error) => {
      console.error("Order creation failed:", error);
      setIsProcessing(false);

      let errorTitle = "Order Creation Failed";
      let errorDescription =
        "We encountered an issue while creating your order. Please try again.";

      if (error.data?.code === "BAD_REQUEST") {
        errorTitle = "Invalid Order Information";
        errorDescription =
          error.message || "Please check your order details and try again.";
      } else if (error.data?.code === "UNAUTHORIZED") {
        errorTitle = "Authentication Required";
        errorDescription = "Please sign in to complete your order.";
      } else if (error.data?.code === "FORBIDDEN") {
        errorTitle = "Access Denied";
        errorDescription = "You do not have permission to create this order.";
      } else if (error.data?.code === "CONFLICT") {
        errorTitle = "Order Conflict";
        errorDescription =
          "Some items in your cart are no longer available or have changed in price.";
      } else if (error.data?.code === "TOO_MANY_REQUESTS") {
        errorTitle = "Too Many Requests";
        errorDescription =
          "You have created too many orders recently. Please wait a few minutes.";
      } else if (error.message) {
        errorDescription = error.message;
      }

      setErrorMessage({
        type: "error",
        title: errorTitle,
        message: errorDescription,
      });
    },
  });

  // Handle Cryptomus payment flow
  const handleCryptomusPayment = async (orderId: string) => {
    const response = await fetch("/api/payment/cryptomus/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        amount: totalPrice,
        currency: "USD",
        returnUrl: `${window.location.origin}/dashboard/orders/${orderId}`,
        callbackUrl: `${window.location.origin}/api/webhooks/cryptomus`,
      }),
    });

    const result = await response.json();

    if (result.success && result.paymentUrl) {
      // Clear cart before redirecting to payment
      clearCart();
      // Redirect to Cryptomus payment page
      window.location.href = result.paymentUrl;
    } else {
      throw new Error(result.error || "Failed to create Cryptomus payment session");
    }
  };

  // Handle Iyzico payment flow
  const handleIyzicoPayment = async (orderId: string) => {
    if (!session?.user) {
      throw new Error("Please sign in to continue with payment");
    }

    const user = session.user;
    
    // Prepare checkout data with real user information
    const checkoutData = {
      orderId,
      amount: totalPrice,
      currency: "USD",
      buyer: {
        id: user.id || `U${orderId}`,
        name: user.name?.split(' ')[0] || "Customer",
        surname: user.name?.split(' ').slice(1).join(' ') || "User",
        gsmNumber: "+905551234567", // TODO: Add phone field to user profile
        email: user.email || "customer@example.com",
        identityNumber: "12345678901", // TODO: Add identity number field to user profile
        registrationAddress: "User Address", // TODO: Add address field to user profile
        ip: "127.0.0.1", // Will be updated by server
        city: "Istanbul", // TODO: Add city field to user profile
        country: "Turkey", // TODO: Add country field to user profile
        zipCode: "34000", // TODO: Add zip code field to user profile
      },
      billingAddress: {
        contactName: user.name || "Customer User",
        city: "Istanbul", // TODO: Add billing address to user profile
        country: "Turkey", // TODO: Add billing address to user profile
        address: "User Billing Address", // TODO: Add billing address to user profile
        zipCode: "34000", // TODO: Add billing address to user profile
      },
      basketItems: [
        {
          id: `BI${orderId}`,
          name: "Subscription Payment",
          category1: "Digital Services",
          category2: "Subscription",
          itemType: "VIRTUAL" as const,
          price: totalPrice.toFixed(2),
        },
      ],
    };

    const response = await fetch("/api/payment/iyzico/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    });

    const result = await response.json();

    if (result.success && result.paymentUrl) {
      // Clear cart before redirecting to payment
      clearCart();
      // Redirect to iyzico's hosted payment page
      window.location.href = result.paymentUrl;
    } else {
      throw new Error(result.error || "Failed to create payment session");
    }
  };

  const paymentMethods = [
    {
      id: "iyzico",
      name: "Credit Card",
      description: "Pay securely with your credit or debit card",
      icon: <CreditCard className="w-5 h-5" />,
      currency: "Credit Card",
      color: "bg-blue-600",
      externalUrl: "https://iyzico.com",
    },
    {
      id: "cryptomus",
      name: "Cryptomus",
      description:
        "Pay with Bitcoin, Ethereum, USDT, or other cryptocurrencies",
      icon: <Shield className="w-5 h-5" />,
      currency: "Cryptocurrency",
      color: "bg-orange-600",
      externalUrl: "https://cryptomus.com",
    },
    ...(isAdmin
      ? [
          {
            id: "admin_bypass",
            name: "Admin Bypass",
            description: "Bypass payment for testing purposes (Admin only)",
            icon: <Settings className="w-5 h-5" />,
            currency: "Test Mode",
            color: "bg-red-600",
            externalUrl: null,
          },
        ]
      : []),
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Create order
      const orderResult = await createOrderMutation.mutateAsync({
        items: items.map((item) => ({
          planId: item.planId,
          quantity: item.quantity,
        })),
        paymentMethod:
          selectedPayment === "admin_bypass" 
            ? "ADMIN_BYPASS" 
            : selectedPayment === "iyzico" 
            ? "IYZICO"
            : "CRYPTOMUS",
      });

      if (selectedPayment === "admin_bypass") {
        // Admin bypass - order completed immediately
        setErrorMessage({
          type: "success",
          title: "Order Completed!",
          message: "Admin bypass order has been processed successfully.",
        });

        // Clear cart after successful order
        clearCart();
      } else if (selectedPayment === "iyzico") {
        // Handle Iyzico payment flow
        await handleIyzicoPayment(orderResult.orderId);
      } else if (selectedPayment === "cryptomus") {
        // Handle Cryptomus payment flow
        await handleCryptomusPayment(orderResult.orderId);
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Error is handled by the mutation's onError callback
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = (planId: string) => {
    removeItem(planId);
  };

  const handleUpdateQuantity = (planId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(planId);
    } else {
      updateQuantity(planId, newQuantity);
    }
  };

  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    const bgColor =
      errorMessage.type === "error"
        ? "bg-red-900/20 border-red-500/30"
        : errorMessage.type === "success"
          ? "bg-green-900/20 border-green-500/30"
          : "bg-yellow-900/20 border-yellow-500/30";

    const textColor =
      errorMessage.type === "error"
        ? "text-red-400"
        : errorMessage.type === "success"
          ? "text-green-400"
          : "text-yellow-400";

    const Icon =
      errorMessage.type === "error"
        ? AlertTriangle
        : errorMessage.type === "success"
          ? CheckCircle
          : AlertTriangle;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${bgColor} mb-6`}
      >
        <div className="flex items-start">
          <Icon className={`h-5 w-5 ${textColor} mt-0.5 mr-3 flex-shrink-0`} />
          <div className="flex-1">
            <h4 className={`font-medium ${textColor} mb-1`}>
              {errorMessage.title}
            </h4>
            <p className="text-gray-300 text-sm">{errorMessage.message}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="text-gray-400 mb-8">
                <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-white mb-4">
                  Your cart is empty
                </h1>
                <p className="text-gray-400 mb-8">
                  Add some amazing subscriptions to your cart before checking
                  out!
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Error/Success Message */}
            {renderErrorMessage()}

            {/* Header */}
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Continue Shopping
              </Link>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white"
              >
                Checkout
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 mt-2"
              >
                Review your order and complete your purchase securely
              </motion.p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Order Summary and Payment Methods */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gray-700/30 rounded-lg p-5 border border-gray-600/30 hover:border-gray-500/50 transition-all"
                      >
                        {/* Product Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {/* Product Icon */}
                            <div className="w-14 h-14 flex-shrink-0">
                              {item.logoUrl ? (
                                <Image
                                  src={item.logoUrl}
                                  alt={item.productName}
                                  width={56}
                                  height={56}
                                  className="w-full h-full rounded-lg object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div
                                  className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                  style={{
                                    backgroundColor:
                                      item.borderColor || "#9333EA",
                                  }}
                                >
                                  {item.productName[0]}
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {item.productName}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {item.planType} Plan •{" "}
                                {item.billingPeriod
                                  .toLowerCase()
                                  .replace("ly", "")}
                              </p>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <motion.button
                            onClick={() => handleRemoveItem(item.planId)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 hover:border-red-500/50 rounded-lg transition-colors text-red-400 hover:text-red-300 group"
                            title="Remove item"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          </motion.button>
                        </div>

                        {/* Controls and Price Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-400 font-medium">
                              Quantity:
                            </span>
                            <div className="flex items-center bg-gray-800/60 rounded-lg border border-gray-600/50">
                              <motion.button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.planId,
                                    item.quantity - 1,
                                  )
                                }
                                className="p-2 hover:bg-gray-600/50 rounded-l-lg transition-colors text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Minus className="h-4 w-4" />
                              </motion.button>
                              <span className="px-4 py-2 text-white font-medium bg-gray-700/50 min-w-[3.5rem] text-center">
                                {item.quantity}
                              </span>
                              <motion.button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.planId,
                                    item.quantity + 1,
                                  )
                                }
                                className="p-2 hover:bg-gray-600/50 rounded-r-lg transition-colors text-gray-300 hover:text-white"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Plus className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="font-bold text-white text-xl">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                            {item.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">
                                {formatPrice(
                                  item.originalPrice * item.quantity,
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 pt-4 mt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Discount</span>
                        <span className="text-green-400">$0.00</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-700">
                        <span>Total</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Payment Methods */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Payment Method
                  </h2>

                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`relative border rounded-lg p-4 transition-all cursor-pointer ${
                          selectedPayment === method.id
                            ? "border-purple-500 bg-purple-900/20"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center`}
                          >
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-white">
                                {method.name}
                              </h3>
                              {method.externalUrl && (
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {method.currency}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 ${
                              selectedPayment === method.id
                                ? "border-purple-500 bg-purple-500"
                                : "border-gray-600"
                            }`}
                          >
                            {selectedPayment === method.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Order Total and Security */}
              <div className="space-y-6">
                {/* Order Total */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Order Total
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal ({items.length} items)</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Taxes</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                      <div className="flex justify-between text-lg font-bold text-white">
                        <span>Total</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || !selectedPayment}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      isProcessing || !selectedPayment
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30"
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Complete Order"
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    By completing your order, you agree to our Terms of Service
                    and Privacy Policy
                  </p>
                </motion.div>

                {/* Security Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-2 text-green-400" />
                    Secure Checkout
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        256-bit SSL encryption
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        PCI DSS compliant
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        Fraud protection
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Support */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 text-center"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Need Help?
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Our support team is here to help you with your purchase
                  </p>
                  <Link
                    href="/dashboard/support"
                    className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Contact Support
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
