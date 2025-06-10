"use client";

import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ProductRatingProps {
  productId: string;
}

export default function ProductRating({ productId }: ProductRatingProps) {
  const { data: reviewStats } = trpc.review.getProductStats.useQuery({
    productId,
  });

  if (!reviewStats || reviewStats.totalReviews === 0) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-gray-400 text-xs">Rating</span>
        </div>
        <p className="text-sm font-bold text-gray-500">No reviews</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-1">
        <Star className="h-4 w-4 text-yellow-400" />
        <span className="text-gray-400 text-xs">Rating</span>
      </div>
      <p className="text-lg font-bold text-white">
        {reviewStats.averageRating.toFixed(1)}
      </p>
    </div>
  );
}

