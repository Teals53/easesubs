"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Package, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Image from "next/image";
import ReviewForm from "@/components/product/ReviewForm";

// Type definition based on the TRPC router return structure
type ReviewableItem = {
  id: string;
  plan: {
    product: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
  };
  order: {
    orderNumber: string;
    completedAt: Date | null;
  };
};

export default function ReviewableItems() {
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);

  const {
    data: reviewableItems,
    isLoading,
    refetch,
  } = trpc.review.getReviewableItems.useQuery();

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Items to Review
        </h3>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-600 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-32"></div>
                </div>
                <div className="w-24 h-8 bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!reviewableItems || reviewableItems.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Items to Review
        </h3>
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No items available for review</p>
          <p className="text-sm text-gray-500 mt-1">
            Complete some orders to leave reviews
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
          Items to Review
        </h3>
        <div className="space-y-4">
          {reviewableItems.map((item: ReviewableItem) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-700/30 rounded-lg gap-4"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {item.plan.product.logoUrl ? (
                  <Image
                    src={item.plan.product.logoUrl}
                    alt={item.plan.product.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "inline-block";
                    }}
                    unoptimized
                  />
                ) : null}
                {!item.plan.product.logoUrl && (
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-white truncate">
                    {item.plan.product.name}
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-400">
                    <span className="truncate">
                      Order #{item.order.orderNumber}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.order.completedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowReviewForm(item.id)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Write Review</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReviewForm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <ReviewForm
                orderItemId={showReviewForm}
                productName={
                  (reviewableItems as ReviewableItem[]).find(
                    (item: ReviewableItem) => item.id === showReviewForm,
                  )?.plan.product.name || "Product"
                }
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
