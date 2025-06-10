import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const orderRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              planId: z.string(),
              quantity: z.number().positive().default(1),
            }),
          )
          .min(1),
        paymentMethod: z.enum(["CRYPTOMUS", "WEEPAY", "ADMIN_BYPASS"]),

        redirectUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is admin for ADMIN_BYPASS
      if (
        input.paymentMethod === "ADMIN_BYPASS" &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin bypass payment method requires admin privileges",
        });
      }

      try {
        // Get plan details and validate
        const planIds = input.items.map((item) => item.planId);
        const plans = await ctx.db.productPlan.findMany({
          where: {
            id: { in: planIds },
            isAvailable: true,
          },
          include: {
            product: true,
          },
        });

        if (plans.length !== planIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more plans are not available",
          });
        }

        // Enhanced stock availability check with detailed error messages
        const stockValidationErrors = [];
        for (const item of input.items) {
          const plan = plans.find(
            (p: (typeof plans)[0]) => p.id === item.planId,
          );
          if (!plan) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid plan selected",
            });
          }

          // For AUTOMATIC delivery, check stock availability
          if (plan.deliveryType === "AUTOMATIC") {
            const availableStock = await ctx.db.stockItem.count({
              where: {
                planId: item.planId,
                isUsed: false,
              },
            });

            if (availableStock === 0) {
              stockValidationErrors.push({
                productName: plan.product.name,
                planType: plan.planType,
                requested: item.quantity,
                available: 0,
                error: "Out of stock",
              });
            } else if (availableStock < item.quantity) {
              stockValidationErrors.push({
                productName: plan.product.name,
                planType: plan.planType,
                requested: item.quantity,
                available: availableStock,
                error: `Only ${availableStock} available`,
              });
            }
          }
          // MANUAL delivery plans have unlimited stock
        }

        // If there are stock validation errors, throw detailed error
        if (stockValidationErrors.length > 0) {
          const errorMessages = stockValidationErrors.map(
            (error) =>
              `${error.productName} (${error.planType}): ${error.error}`,
          );
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Stock validation failed:\n${errorMessages.join("\n")}`,
            cause: { stockErrors: stockValidationErrors },
          });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = input.items.map((item) => {
          const plan = plans.find(
            (p: (typeof plans)[0]) => p.id === item.planId,
          );
          if (!plan) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid plan selected",
            });
          }
          const itemTotal = Number(plan.price) * item.quantity;
          subtotal += itemTotal;
          return {
            planId: item.planId,
            quantity: item.quantity,
            price: plan.price,
            currency: plan.currency,
            deliveryType: plan.deliveryType as "MANUAL" | "AUTOMATIC",
          };
        });

        // Tax is permanently set to 0
        const tax = 0;
        const total = subtotal + tax;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Stock is now managed through the StockItem system for AUTOMATIC delivery
        // MANUAL delivery plans don't require stock management

        // Create order
        const order = await ctx.db.order.create({
          data: {
            userId,
            orderNumber,
            status:
              input.paymentMethod === "ADMIN_BYPASS" ? "COMPLETED" : "PENDING",
            paymentMethod: input.paymentMethod,
            subtotal,
            tax,
            total,
            currency: "USD",
            completedAt:
              input.paymentMethod === "ADMIN_BYPASS" ? new Date() : undefined,
            items: {
              create: orderItems,
            },
          },
        });

        // Get the created order with items for subscription creation
        const orderWithItems = await ctx.db.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: {
                plan: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        });

        // If ADMIN_BYPASS, create subscriptions immediately and auto ticket
        if (input.paymentMethod === "ADMIN_BYPASS" && orderWithItems) {
          for (const item of orderWithItems.items) {
            const startDate = new Date();
            const endDate = new Date(
              startDate.getTime() + item.plan.duration * 24 * 60 * 60 * 1000,
            );

            await ctx.db.userSubscription.create({
              data: {
                userId,
                planId: item.planId,
                orderId: order.id,
                status: "ACTIVE",
                startDate,
                endDate,
                renewalDate: endDate,
                price: item.price,
                currency: item.currency,
                billingPeriod: item.plan.billingPeriod,
                autoRenew: true,
              },
            });
          }

          // Process deliveries for admin bypass orders
          try {
            const { DeliveryService } = await import("@/lib/delivery-service");
            for (const item of orderWithItems.items) {
              await DeliveryService.processDelivery({
                orderId: orderWithItems.id,
                orderItemId: item.id,
              });
              // Processed delivery for admin bypass order item
            }
          } catch {
            // Error handled - delivery failed for admin bypass order
          }
        }

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          redirectUrl: `/dashboard/orders/${order.id}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order. Please try again.",
        });
      }
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        status: z
          .enum([
            "PENDING",
            "PROCESSING",
            "COMPLETED",
            "CANCELLED",
            "REFUNDED",
            "FAILED",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status && { status: input.status }),
        },
        include: {
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
              ticket: {
                select: {
                  id: true,
                  ticketNumber: true,
                  status: true,
                },
              },
              stockItem: {
                select: {
                  id: true,
                  content: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });

      return {
        orders,
        nextCursor:
          orders.length === input.limit
            ? orders[orders.length - 1]?.id
            : undefined,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
              ticket: {
                select: {
                  id: true,
                  ticketNumber: true,
                  status: true,
                },
              },
              stockItem: {
                select: {
                  id: true,
                  content: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
          },
          subscriptions: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return order;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found or cannot be cancelled",
        });
      }

      // Update order status
      const updatedOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });

      // Restore stock quantities - Note: Stock is managed through StockItem table, not ProductPlan
      // The stock restoration is handled automatically when StockItems are marked as unused
      // This section is kept for reference but the stockQuantity field doesn't exist

      return updatedOrder;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalOrders, pendingOrders, completedOrders, totalSpent] =
      await Promise.all([
        ctx.db.order.count({
          where: { userId: ctx.session.user.id },
        }),
        ctx.db.order.count({
          where: {
            userId: ctx.session.user.id,
            status: { in: ["PENDING", "PROCESSING"] },
          },
        }),
        ctx.db.order.count({
          where: {
            userId: ctx.session.user.id,
            status: "COMPLETED",
          },
        }),
        ctx.db.order.aggregate({
          where: {
            userId: ctx.session.user.id,
            status: "COMPLETED",
          },
          _sum: { total: true },
        }),
      ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSpent: totalSpent._sum.total || 0,
    };
  }),

  // New endpoint to handle order conflicts and stock validation during payment
  validateOrderForPayment: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.orderId,
          userId: ctx.session.user.id,
          status: "PENDING", // Only validate pending orders
        },
        include: {
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found or already processed",
        });
      }

      const validationResults = [];
      let hasStockIssues = false;

      for (const item of order.items) {
        if (item.plan.deliveryType === "AUTOMATIC") {
          const availableStock = await ctx.db.stockItem.count({
            where: {
              planId: item.planId,
              isUsed: false,
            },
          });

          if (availableStock === 0) {
            validationResults.push({
              orderItemId: item.id,
              planId: item.planId,
              productName: item.plan.product.name,
              planType: item.plan.planType,
              requestedQuantity: item.quantity,
              availableStock: 0,
              valid: false,
              error: "Out of stock",
            });
            hasStockIssues = true;
          } else if (availableStock < item.quantity) {
            validationResults.push({
              orderItemId: item.id,
              planId: item.planId,
              productName: item.plan.product.name,
              planType: item.plan.planType,
              requestedQuantity: item.quantity,
              availableStock,
              valid: false,
              error: `Only ${availableStock} available`,
            });
            hasStockIssues = true;
          } else {
            validationResults.push({
              orderItemId: item.id,
              planId: item.planId,
              productName: item.plan.product.name,
              planType: item.plan.planType,
              requestedQuantity: item.quantity,
              availableStock,
              valid: true,
              error: null,
            });
          }
        } else {
          // MANUAL delivery is always valid
          validationResults.push({
            orderItemId: item.id,
            planId: item.planId,
            productName: item.plan.product.name,
            planType: item.plan.planType,
            requestedQuantity: item.quantity,
            availableStock: null,
            valid: true,
            error: null,
          });
        }
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        valid: !hasStockIssues,
        items: validationResults,
        canProceedWithPayment: !hasStockIssues,
      };
    }),

  // New endpoint to cancel order due to stock conflicts
  cancelDueToStockConflict: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().optional().default("Stock no longer available"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.orderId,
          userId: ctx.session.user.id,
          status: "PENDING",
        },
        include: {
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found or cannot be cancelled",
        });
      }

      // Update order status to cancelled
      const cancelledOrder = await ctx.db.order.update({
        where: { id: input.orderId },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
        },
        include: {
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Clear user's cart items for the cancelled products
      const planIds = order.items.map(
        (item: (typeof order.items)[0]) => item.planId,
      );
      await ctx.db.cartItem.deleteMany({
        where: {
          userId: ctx.session.user.id,
          planId: { in: planIds },
        },
      });

      return {
        orderId: cancelledOrder.id,
        orderNumber: cancelledOrder.orderNumber,
        status: cancelledOrder.status,
        reason: input.reason,
        cancelledItems: cancelledOrder.items.map(
          (item: (typeof cancelledOrder.items)[0]) => ({
            productName: item.plan.product.name,
            planType: item.plan.planType,
            quantity: item.quantity,
          }),
        ),
      };
    }),

  // New endpoint to cancel conflicting orders when stock is consumed
  cancelConflictingOrders: protectedProcedure
    .input(
      z.object({
        completedOrderId: z.string(),
        planIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // This endpoint is called when an order is completed to cancel other pending orders for the same products

      const conflictingOrders = await ctx.db.order.findMany({
        where: {
          id: { not: input.completedOrderId }, // Exclude the completed order
          status: "PENDING",
          items: {
            some: {
              planId: { in: input.planIds },
              plan: {
                deliveryType: "AUTOMATIC", // Only check automatic delivery items
              },
            },
          },
        },
        include: {
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
            },
          },
          user: true,
          payments: true,
        },
      });

      const cancelledOrders = [];

      for (const order of conflictingOrders) {
        // Check if this order has stock conflicts
        const stockConflicts: Array<{
          planId: string;
          productName: string;
          planType: string;
          requested: number;
          available: number;
        }> = [];

        for (const item of order.items) {
          if (item.plan.deliveryType === "AUTOMATIC") {
            const availableStock = await ctx.db.stockItem.count({
              where: {
                planId: item.planId,
                isUsed: false,
              },
            });

            if (availableStock < item.quantity) {
              stockConflicts.push({
                planId: item.planId,
                productName: item.plan.product.name,
                planType: item.plan.planType,
                requested: item.quantity,
                available: availableStock,
              });
            }
          }
        }

        // If there are stock conflicts, cancel this order
        if (stockConflicts.length > 0) {
          const cancelledOrder = await ctx.db.$transaction(async (tx) => {
            // Update order status
            const updatedOrder = await tx.order.update({
              where: { id: order.id },
              data: {
                status: "CANCELLED",
                completedAt: new Date(),
              },
            });

            // Update any pending payments for this order
            await tx.payment.updateMany({
              where: {
                orderId: order.id,
                status: "PENDING",
              },
              data: {
                status: "CANCELLED",
                failureReason: `Order cancelled due to stock conflict: ${stockConflicts.map((c) => `${c.productName} (${c.available}/${c.requested})`).join(", ")}`,
                completedAt: new Date(),
              },
            });

            // Clear user's cart items for the cancelled products
            const conflictPlanIds = stockConflicts.map((c) => c.planId);
            await tx.cartItem.deleteMany({
              where: {
                userId: order.userId,
                planId: { in: conflictPlanIds },
              },
            });

            return updatedOrder;
          });

          cancelledOrders.push({
            orderId: cancelledOrder.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.user.email,
            stockConflicts,
            cancelledAt: new Date(),
          });

          // Cancelled conflicting order due to stock conflicts
        }
      }

      return {
        cancelledCount: cancelledOrders.length,
        cancelledOrders,
      };
    }),
});
