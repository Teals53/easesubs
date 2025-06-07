"use client";

import { motion } from "framer-motion";
import { Search, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-8xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full">
            <Search className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>

        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </motion.div>
        </div>

        <div className="mt-8">
          <p className="text-gray-500 text-sm mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/#products"
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Browse Products
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/legal/privacy-policy"
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/legal/terms-of-service"
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
