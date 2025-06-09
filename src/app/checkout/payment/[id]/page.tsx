"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Loader2,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type PaymentStatus =
  | "loading"
  | "processing"
  | "success"
  | "error"
  | "redirect";

type PaymentData = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  method: string;
  failureReason?: string;
  orderId: string;
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const paymentId = params.id as string;

  // Check if status is provided in URL (from callback redirect)
  const urlStatus = searchParams.get('status');
  const isFreshFromCallback = searchParams.get('fresh') === 'true';

  // Always fetch from database, but with different timing based on callback status
  const shouldFetchImmediately = !isFreshFromCallback;
  const [shouldFetchAfterDelay, setShouldFetchAfterDelay] = useState(false);

  // Get payment details - with dynamic timing based on callback status
  const {
    data: payment,
    isLoading: paymentLoading,
    error: paymentError,
    refetch,
  } = trpc.payment.getPayment.useQuery(
    { paymentId },
    {
      enabled: !!paymentId && !!session && (shouldFetchImmediately || shouldFetchAfterDelay),
      retry: 3,
      retryDelay: 2000,
      refetchInterval: paymentStatus === "processing" ? 5000 : false,
    },
  );

  // Set up delayed fetch for callback scenarios
  useEffect(() => {
    if (isFreshFromCallback && urlStatus) {
      // For fresh callback, wait a bit then fetch from database to ensure consistency
      const timer = setTimeout(() => {
        setShouldFetchAfterDelay(true);
      }, 500); // 500ms delay to allow database transaction to complete
      
      return () => clearTimeout(timer);
    }
  }, [isFreshFromCallback, urlStatus]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // PRIORITY 1: If we have fresh status from callback, use it immediately for fast feedback
    if (isFreshFromCallback && urlStatus && !payment) {
      console.log("🔵 Using fresh callback status temporarily:", urlStatus);
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('status');
      newUrl.searchParams.delete('fresh');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Create temporary payment data for immediate display
      const tempPaymentData: PaymentData = {
        id: paymentId,
        status: urlStatus.toUpperCase(),
        amount: "0.00", // Temporary until we get real data
        currency: "TRY",
        method: "IYZICO",
        orderId: "unknown",
        failureReason: urlStatus === "failed" ? "Payment processing failed" : undefined,
      };
      
      setPaymentData(tempPaymentData);
      
      if (urlStatus === "completed") {
        setPaymentStatus("success");
      } else if (urlStatus === "failed") {
        setPaymentStatus("error");
        setErrorMessage("Payment has failed");
      } else {
        setPaymentStatus("processing");
      }
      return;
    }

    // PRIORITY 2: Use database data when available (more accurate)
    if (payment) {
      console.log("🔵 Using database payment data:", payment.status);
      
      setPaymentData({
        id: payment.id,
        status: payment.status,
        amount: payment.amount.toString(),
        currency: payment.currency,
        method: payment.method,
        failureReason: payment.failureReason || undefined,
        orderId: payment.orderId,
      });

      if (payment.status === "PENDING") {
        setPaymentStatus("processing");
      } else if (payment.status === "COMPLETED") {
        setPaymentStatus("success");
      } else if (payment.status === "FAILED") {
        setPaymentStatus("error");
        setErrorMessage(payment.failureReason || "Payment has failed");
      }
      return;
    }

    // PRIORITY 3: Handle errors
    if (paymentError) {
      setPaymentStatus("error");
      setErrorMessage("Payment not found or access denied");
      return;
    }
  }, [session, status, payment, paymentError, router, urlStatus, isFreshFromCallback, paymentId]);

  // Handle manual retry (refresh from database)
  const handleRetry = () => {
    setPaymentStatus("loading");
    setErrorMessage("");
    setPaymentData(null);
    refetch();
  };

  // Loading state - show spinner only when we're actually fetching and have no data
  if (
    status === "loading" ||
    paymentStatus === "loading" ||
    ((shouldFetchImmediately || shouldFetchAfterDelay) && paymentLoading && !paymentData)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Loading Payment
          </h2>
          <p className="text-gray-400">
            Please wait while we prepare your payment details...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 max-w-md w-full text-center"
      >
        {paymentStatus === "processing" && (
          <>
            <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Payment Pending
            </h2>
            <p className="text-gray-400 mb-6">
              Your payment is being processed. This page will update
              automatically when the payment is complete.
            </p>
            {paymentData && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-white mb-2">
                  Payment Details:
                </h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>
                    Payment ID:{" "}
                    <span className="text-white font-mono text-xs">
                      {paymentData.id}
                    </span>
                  </div>
                  {paymentData.amount !== "0.00" && (
                  <div>
                    Amount:{" "}
                    <span className="text-white">
                        {paymentData.currency} {Number(paymentData.amount).toFixed(2)}
                    </span>
                  </div>
                  )}
                  <div>
                    Method: <span className="text-white">{paymentData.method}</span>
                  </div>
                  <div>
                    Status:{" "}
                    <span className="text-blue-400">{paymentData.status}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Status
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </motion.button>
            </div>
          </>
        )}

        {paymentStatus === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-400 mb-6">
              Your payment has been processed successfully. You can now access
              your purchased services.
            </p>
            {paymentData && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-white mb-2">
                  Payment Details:
                </h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>
                    Payment ID:{" "}
                    <span className="text-white font-mono text-xs">
                      {paymentData.id}
                    </span>
                  </div>
                  {paymentData.amount !== "0.00" && (
                    <div>
                      Amount:{" "}
                      <span className="text-white">
                        {paymentData.currency} {Number(paymentData.amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div>
                    Method: <span className="text-white">{paymentData.method}</span>
                  </div>
                  <div>
                    Status:{" "}
                    <span className="text-green-400">COMPLETED</span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ExternalLink className="h-4 w-4" />
              </motion.button>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/orders")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
                View Orders
            </motion.button>
            </div>
          </>
        )}

        {paymentStatus === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-400 mb-6">
              {errorMessage || "Something went wrong with your payment. Please try again."}
            </p>
            {paymentData && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-white mb-2">
                  Payment Details:
                </h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>
                    Payment ID:{" "}
                    <span className="text-white font-mono text-xs">
                      {paymentData.id}
                    </span>
                  </div>
                  {paymentData.amount !== "0.00" && (
                    <div>
                      Amount:{" "}
                      <span className="text-white">
                        {paymentData.currency} {Number(paymentData.amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div>
                    Method: <span className="text-white">{paymentData.method}</span>
                  </div>
                  <div>
                    Status:{" "}
                    <span className="text-red-400">FAILED</span>
                  </div>
                  {paymentData.failureReason && (
                    <div>
                      Reason:{" "}
                      <span className="text-red-400">{paymentData.failureReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/checkout")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetry}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Status
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
