import { z } from "zod";
import { createTRPCRouter, protectedProcedure, actionProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const cartRouter = createTRPCRouter({
  getItems: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id || ctx.session.user.id === "") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid user session. Please sign in again.",
      });
    }

    const cartItems = await ctx.db.cartItem.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        plan: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const validatedItems = [];
    const stockUpdates = [];

    for (const item of cartItems) {
      if (item.plan.deliveryType === "AUTOMATIC") {
        const availableStock = await ctx.db.stockItem.count({
          where: {
            planId: item.planId,
            isUsed: false,
          },
        });

        if (availableStock === 0) {
          stockUpdates.push(
            ctx.db.cartItem.delete({
              where: { id: item.id },
            }),
          );
          continue;
        } else if (availableStock < item.quantity) {
          const updatedItem = await ctx.db.cartItem.update({
            where: { id: item.id },
            data: { quantity: availableStock },
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
            },
          });
          validatedItems.push({
            ...updatedItem,
            stockAdjusted: true,
            previousQuantity: item.quantity,
            availableStock,
          });
        } else {
          validatedItems.push({
            ...item,
            stockAdjusted: false,
            availableStock,
          });
        }
      } else {
        validatedItems.push({
          ...item,
          stockAdjusted: false,
          availableStock: null,
        });
      }
    }

    if (stockUpdates.length > 0) {
      await ctx.db.$transaction(stockUpdates);
    }

    return validatedItems;
  }),

  getStockAvailability: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.productPlan.findUnique({
        where: { id: input.planId },
        select: { deliveryType: true, product: { select: { name: true } } },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      if (plan.deliveryType === "MANUAL") {
        return {
          available: true,
          count: null,
          deliveryType: "MANUAL",
          maxCartQuantity: 999,
        };
      }

      const stockCount = await ctx.db.stockItem.count({
        where: {
          planId: input.planId,
          isUsed: false,
        },
      });

      const cartQuantity = await ctx.db.cartItem.findUnique({
        where: {
          userId_planId: {
            userId: ctx.session.user.id,
            planId: input.planId,
          },
        },
        select: { quantity: true },
      });

      const currentCartQuantity = cartQuantity?.quantity || 0;
      const maxCartQuantity = Math.max(0, stockCount - currentCartQuantity);

      return {
        available: stockCount > 0,
        count: stockCount,
        deliveryType: "AUTOMATIC",
        currentCartQuantity,
        maxCartQuantity,
      };
    }),

  add: actionProcedure
    .input(
      z.object({
        planId: z.string(),
        quantity: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id || ctx.session.user.id === "") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid user session. Please sign in again.",
        });
      }

      const plan = await ctx.db.productPlan.findUnique({
        where: {
          id: input.planId,
          isAvailable: true,
        },
        include: {
          product: true,
        },
      });

      if (!plan || !plan.product.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product plan not available",
        });
      }

      const userExists = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { id: true, isActive: true },
      });

      if (!userExists || !userExists.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User account not found or inactive. Please sign in again.",
        });
      }

      const cartItem = await ctx.db.$transaction(async (tx) => {
        let availableStock = null;
        if (plan.deliveryType === "AUTOMATIC") {
          availableStock = await tx.stockItem.count({
            where: {
              planId: input.planId,
              isUsed: false,
            },
          });

          if (availableStock === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${plan.product.name} is currently out of stock`,
            });
          }
        }

        const existingItem = await tx.cartItem.findUnique({
          where: {
            userId_planId: {
              userId: ctx.session.user.id,
              planId: input.planId,
            },
          },
        });

        const newTotalQuantity = (existingItem?.quantity || 0) + input.quantity;

        if (plan.deliveryType === "AUTOMATIC" && availableStock !== null) {
          if (newTotalQuantity > availableStock) {
            const maxAddable = availableStock - (existingItem?.quantity || 0);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                maxAddable > 0
                  ? `Only ${maxAddable} more items can be added to cart. ${availableStock} total available.`
                  : `Cannot add more items. Maximum ${availableStock} items available and you already have ${existingItem?.quantity || 0} in cart.`,
            });
          }
        }

        return await tx.cartItem.upsert({
          where: {
            userId_planId: {
              userId: ctx.session.user.id,
              planId: input.planId,
            },
          },
          update: {
            quantity: newTotalQuantity,
          },
          create: {
            userId: ctx.session.user.id,
            planId: input.planId,
            quantity: input.quantity,
          },
          include: {
            plan: {
              include: {
                product: true,
              },
            },
          },
        });
      });

      return {
        ...cartItem,
        availableStock:
          plan.deliveryType === "AUTOMATIC"
            ? await ctx.db.stockItem.count({
                where: {
                  planId: input.planId,
                  isUsed: false,
                },
              })
            : null,
      };
    }),

  updateQuantity: actionProcedure
    .input(
      z.object({
        planId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id || ctx.session.user.id === "") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid user session. Please sign in again.",
        });
      }

      const cartItem = await ctx.db.cartItem.findUnique({
        where: {
          userId_planId: {
            userId: ctx.session.user.id,
            planId: input.planId,
          },
        },
        include: {
          plan: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cartItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      const updatedItem = await ctx.db.$transaction(async (tx) => {
        if (cartItem.plan.deliveryType === "AUTOMATIC") {
          const availableStock = await tx.stockItem.count({
            where: {
              planId: input.planId,
              isUsed: false,
            },
          });

          if (availableStock < input.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Only ${availableStock} items available in stock. Cannot set quantity to ${input.quantity}.`,
            });
          }
        }

        return await tx.cartItem.update({
          where: {
            userId_planId: {
              userId: ctx.session.user.id,
              planId: input.planId,
            },
          },
          data: {
            quantity: input.quantity,
          },
          include: {
            plan: {
              include: {
                product: true,
              },
            },
          },
        });
      });

      return {
        ...updatedItem,
        availableStock:
          cartItem.plan.deliveryType === "AUTOMATIC"
            ? await ctx.db.stockItem.count({
                where: {
                  planId: input.planId,
                  isUsed: false,
                },
              })
            : null,
      };
    }),

  remove: actionProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id || ctx.session.user.id === "") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid user session. Please sign in again.",
        });
      }

      const deletedItem = await ctx.db.cartItem.delete({
        where: {
          userId_planId: {
            userId: ctx.session.user.id,
            planId: input.planId,
          },
        },
        include: {
          plan: {
            include: {
              product: true,
            },
          },
        },
      });

      return deletedItem;
    }),

  clear: actionProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user?.id || ctx.session.user.id === "") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid user session. Please sign in again.",
      });
    }

    const deletedItems = await ctx.db.cartItem.deleteMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return { deletedCount: deletedItems.count };
  }),

  validateForCheckout: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id || ctx.session.user.id === "") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid user session. Please sign in again.",
      });
    }

    const cartItems = await ctx.db.cartItem.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        plan: {
          include: {
            product: true,
          },
        },
      },
    });

    const validationResults = [];
    let hasErrors = false;

    for (const item of cartItems) {
      if (item.plan.deliveryType === "AUTOMATIC") {
        const availableStock = await ctx.db.stockItem.count({
          where: {
            planId: item.planId,
            isUsed: false,
          },
        });

        if (availableStock === 0) {
          validationResults.push({
            planId: item.planId,
            productName: item.plan.product.name,
            planType: item.plan.planType,
            requestedQuantity: item.quantity,
            availableStock: 0,
            valid: false,
            error: "Out of stock",
          });
          hasErrors = true;
        } else if (availableStock < item.quantity) {
          validationResults.push({
            planId: item.planId,
            productName: item.plan.product.name,
            planType: item.plan.planType,
            requestedQuantity: item.quantity,
            availableStock,
            valid: false,
            error: `Only ${availableStock} available`,
          });
          hasErrors = true;
        } else {
          validationResults.push({
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
        validationResults.push({
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
      valid: !hasErrors,
      items: validationResults,
      totalItems: cartItems.length,
    };
  }),
});
