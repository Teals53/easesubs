"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, User, Calendar, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Image from "next/image";

interface ProductReviewsProps {
  productId: string;
}

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;

  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest" | "helpful"
  >("newest");

  // Fetch review statistics
  const { data: stats } = trpc.review.getProductStats.useQuery({ productId });

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = trpc.review.getByProduct.useInfiniteQuery(
    { productId, limit: 10, sortBy },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const reviews = reviewsData?.pages.flatMap((page) => page.reviews) ?? [];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats?.distribution) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const data = stats.distribution.find((d) => d.rating === rating);
          const count = data?.count || 0;
          const percentage =
            stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-12">
                <span className="text-sm text-gray-400">{rating}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Customer Reviews
        </h3>
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Be the first to review this product after purchasing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-6">
        Customer Reviews
      </h3>

      {/* Review Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Overall Rating */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
            <span className="text-4xl font-bold text-white">
              {stats.averageRating.toFixed(1)}
            </span>
            {renderStars(Math.round(stats.averageRating), "lg")}
          </div>
          <p className="text-gray-400">
            Based on {stats.totalReviews} review
            {stats.totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rating Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Rating Distribution
          </h4>
          {renderRatingDistribution()}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-white">Reviews</h4>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-24 mb-3"></div>
                    <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))
          : reviews.map((review: Review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-gray-700 pb-6 last:border-b-0"
              >
                <div className="flex items-start space-x-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-white">
                          {review.user.name || "Anonymous User"}
                        </h5>
                        <div className="flex items-center space-x-2 mt-1">
                          {renderStars(review.rating, "sm")}
                          <span className="text-xs text-gray-400">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                      <h6 className="font-medium text-white mb-2">
                        {review.title}
                      </h6>
                    )}

                    {/* Review Comment */}
                    {review.comment && (
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {review.comment}
                      </p>
                    )}

                    {/* Helpful count removed per user request */}
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  );
}
