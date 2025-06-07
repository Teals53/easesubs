"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const paymentId = params.id as string;

  // Get payment details with retry logic
  const {
    data: payment,
    isLoading: paymentLoading,
    error: paymentError,
    refetch,
  } = trpc.payment.getPayment.useQuery(
    { paymentId },
    {
      enabled: !!paymentId && !!session,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: paymentStatus === "processing" ? 5000 : false, // Poll every 5 seconds if processing
    },
  );

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (paymentError) {
      // Don't immediately show error - payment might still be being created
      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          refetch();
        }, 2000);
        return;
      }

      setPaymentStatus("error");
      setErrorMessage("Payment not found or access denied");
      return;
    }

    if (payment) {
      if (payment.status === "PENDING") {
        setPaymentStatus("processing");
        // Reset retry count since we found the payment
        setRetryCount(0);
      } else if (payment.status === "COMPLETED") {
        setPaymentStatus("success");
      } else if (payment.status === "FAILED") {
        setPaymentStatus("error");
        setErrorMessage(payment.failureReason || "Payment has failed");
      }
    }
  }, [session, status, payment, paymentError, router, retryCount, refetch]);

  // Handle manual retry
  const handleRetry = () => {
    setPaymentStatus("loading");
    setErrorMessage("");
    setRetryCount(0);
    refetch();
  };

  if (
    status === "loading" ||
    paymentLoading ||
    (paymentStatus === "loading" && retryCount > 0)
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
            {retryCount > 0
              ? `Retrying... (${retryCount}/3)`
              : "Please wait while we prepare your payment..."}
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
        {paymentStatus === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Preparing Payment
            </h2>
            <p className="text-gray-400">Setting up your payment details...</p>
          </>
        )}

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
            {payment && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-white mb-2">
                  Payment Details:
                </h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>
                    Payment ID:{" "}
                    <span className="text-white font-mono text-xs">
                      {payment.id}
                    </span>
                  </div>
                  <div>
                    Amount:{" "}
                    <span className="text-white">
                      {payment.currency} {Number(payment.amount).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    Method: <span className="text-white">{payment.method}</span>
                  </div>
                  <div>
                    Status:{" "}
                    <span className="text-blue-400">{payment.status}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  router.push(`/dashboard/orders/${payment?.orderId}`)
                }
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                View Order Details
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Refresh Status
              </motion.button>
            </div>
          </>
        )}

        {paymentStatus === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-400 mb-6">
              Your payment has been processed successfully.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                router.push(`/dashboard/orders/${payment?.orderId}`)
              }
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              View Order Details
            </motion.button>
          </>
        )}

        {paymentStatus === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Payment Issue
            </h2>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Retry
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/checkout")}
                className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all"
              >
                Try Different Payment
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-500 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
