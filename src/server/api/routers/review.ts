import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const reviewRouter = createTRPCRouter({
  // Create a review for a purchased product
  create: protectedProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this order item and it's from a completed order
      const orderItem = await ctx.db.orderItem.findFirst({
        where: {
          id: input.orderItemId,
          order: {
            userId: ctx.session.user.id,
            status: "COMPLETED",
          },
        },
        include: {
          plan: {
            include: {
              product: true,
            },
          },
          reviews: true,
        },
      });

      if (!orderItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order item not found or order not completed",
        });
      }

      // Check if user already reviewed this order item
      if (orderItem.reviews.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this product purchase",
        });
      }

      // Create the review
      const review = await ctx.db.review.create({
        data: {
          userId: ctx.session.user.id,
          productId: orderItem.plan.product.id,
          orderItemId: input.orderItemId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
      });

      return review;
    }),

  // Update an existing review
  update: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this review
      const existingReview = await ctx.db.review.findFirst({
        where: {
          id: input.reviewId,
          userId: ctx.session.user.id,
        },
      });

      if (!existingReview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Update the review
      const review = await ctx.db.review.update({
        where: { id: input.reviewId },
        data: {
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
      });

      return review;
    }),

  // Delete a review
  delete: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this review
      const existingReview = await ctx.db.review.findFirst({
        where: {
          id: input.reviewId,
          userId: ctx.session.user.id,
        },
      });

      if (!existingReview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      await ctx.db.review.delete({
        where: { id: input.reviewId },
      });

      return { success: true };
    }),

  // Get reviews for a product (public)
  getByProduct: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().optional(),
        sortBy: z
          .enum(["newest", "oldest", "highest", "lowest", "helpful"])
          .default("newest"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const orderBy = (() => {
        switch (input.sortBy) {
          case "newest":
            return { createdAt: "desc" as const };
          case "oldest":
            return { createdAt: "asc" as const };
          case "highest":
            return { rating: "desc" as const };
          case "lowest":
            return { rating: "asc" as const };
          case "helpful":
            return { createdAt: "desc" as const };
          default:
            return { createdAt: "desc" as const };
        }
      })();

      const reviews = await ctx.db.review.findMany({
        where: {
          productId: input.productId,
          isApproved: true,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem!.id;
      }

      return {
        reviews,
        nextCursor,
      };
    }),

  // Get product review statistics
  getProductStats: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.review.aggregate({
        where: {
          productId: input.productId,
          isApproved: true,
        },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Get rating distribution
      const ratingDistribution = await ctx.db.review.groupBy({
        by: ["rating"],
        where: {
          productId: input.productId,
          isApproved: true,
        },
        _count: { rating: true },
      });

      const distribution = [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count:
          ratingDistribution.find((r) => r.rating === rating)?._count.rating ||
          0,
      }));

      return {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
        distribution,
      };
    }),

  // Get user's reviewable order items (completed orders without reviews)
  getReviewableItems: protectedProcedure.query(async ({ ctx }) => {
    const orderItems = await ctx.db.orderItem.findMany({
      where: {
        order: {
          userId: ctx.session.user.id,
          status: "COMPLETED",
        },
        reviews: {
          none: {},
        },
      },
      include: {
        plan: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        order: {
          select: {
            orderNumber: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        order: {
          completedAt: "desc",
        },
      },
    });

    return orderItems;
  }),

  // Get user's reviews
  getUserReviews: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          product: {
            select: {
              name: true,
              logoUrl: true,
              slug: true,
            },
          },
          orderItem: {
            include: {
              order: {
                select: {
                  orderNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem!.id;
      }

      return {
        reviews,
        nextCursor,
      };
    }),

  // Check if user can review a specific order item
  canReview: protectedProcedure
    .input(z.object({ orderItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orderItem = await ctx.db.orderItem.findFirst({
        where: {
          id: input.orderItemId,
          order: {
            userId: ctx.session.user.id,
            status: "COMPLETED",
          },
        },
        include: {
          reviews: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!orderItem) {
        return {
          canReview: false,
          reason: "Order item not found or order not completed",
        };
      }

      if (orderItem.reviews.length > 0) {
        return {
          canReview: false,
          reason: "Already reviewed",
          existingReview: orderItem.reviews[0],
        };
      }

      return { canReview: true };
    }),
});

