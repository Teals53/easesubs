"use client";

import { Users, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ProductStatsProps {
  productId: string;
  plansCount: number;
}

export default function ProductStats({
  productId,
  plansCount,
}: ProductStatsProps) {
  const { data: reviewStats } = trpc.review.getProductStats.useQuery({
    productId,
  });

  return (
    <div className="grid grid-cols-2 gap-4 pt-4">
      <div className="bg-gray-800/50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-400" />
          <span className="text-gray-400">Plans Available</span>
        </div>
        <p className="text-xl font-bold text-white mt-1">{plansCount}</p>
      </div>
      <div className="bg-gray-800/50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-gray-400">Rating</span>
        </div>
        <p className="text-xl font-bold text-white mt-1">
          {reviewStats && reviewStats.totalReviews > 0
            ? `${reviewStats.averageRating.toFixed(1)}/5`
            : "No reviews"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {reviewStats && reviewStats.totalReviews > 0
            ? `Based on ${reviewStats.totalReviews} review${reviewStats.totalReviews !== 1 ? "s" : ""}`
            : "Be the first to review"}
        </p>
      </div>
    </div>
  );
}
