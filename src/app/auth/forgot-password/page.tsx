"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { sanitizeEmail } from "@/lib/input-sanitizer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setIsSubmitted(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      setError("Please enter a valid email address");
      return;
    }

    await requestReset.mutateAsync({ email: sanitizedEmail });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>

              <h1 className="text-2xl font-bold text-white mb-4">
                Check Your Email
              </h1>

              <p className="text-gray-400 mb-6">
                If an account with email{" "}
                <strong className="text-white">{email}</strong> exists, you will
                receive a password reset link shortly.
              </p>

              <p className="text-sm text-gray-500 mb-8">
                Didn&apos;t receive an email? Check your spam folder or try
                again in a few minutes.
              </p>

              <Link
                href="/auth/signin"
                className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-6"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Forgot Password?
            </h1>

            <p className="text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center text-red-400"
              >
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
                maxLength={255}
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={requestReset.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-purple-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestReset.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

