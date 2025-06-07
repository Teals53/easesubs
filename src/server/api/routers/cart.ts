import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const cartRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    // Validate user session and ID
    if (!ctx.session?.user?.id || ctx.session.user.id === '') {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED', 
        message: 'Invalid user session. Please sign in again.' 
      })
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
        createdAt: 'desc',
      },
    })

    return {
      items: cartItems,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cartItems.reduce((sum, item) => sum + Number(item.plan.price) * item.quantity, 0),
    }
  }),

  add: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        quantity: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user session and ID
      if (!ctx.session?.user?.id || ctx.session.user.id === '') {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Invalid user session. Please sign in again.' 
        })
      }

      // Check if plan exists and is available
      const plan = await ctx.db.productPlan.findUnique({
        where: {
          id: input.planId,
          isAvailable: true,
        },
        include: {
          product: true,
        },
      })

      if (!plan || !plan.product.isActive) {
        throw new TRPCError({ 
          code: 'NOT_FOUND', 
          message: 'Product plan not available' 
        })
      }

      // Check stock quantity if limited
      if (plan.stockQuantity !== null && plan.stockQuantity < input.quantity) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Insufficient stock' 
        })
      }

      // Verify user exists in database
      const userExists = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { id: true, isActive: true }
      })

      if (!userExists || !userExists.isActive) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'User account not found or inactive. Please sign in again.' 
        })
      }

      // Upsert cart item (add or update quantity) with atomic operation
      const cartItem = await ctx.db.$transaction(async (tx) => {
        // First, try to find existing item
        const existingItem = await tx.cartItem.findUnique({
          where: {
            userId_planId: {
              userId: ctx.session.user.id,
              planId: input.planId,
            },
          },
          include: {
            plan: true,
          },
        })

        // Check total quantity against stock if item exists
        if (existingItem && plan.stockQuantity !== null) {
          const totalQuantity = existingItem.quantity + input.quantity
          if (plan.stockQuantity < totalQuantity) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: `Only ${plan.stockQuantity - existingItem.quantity} more items available in stock` 
            })
          }
        }

        // Perform the upsert operation
        return await tx.cartItem.upsert({
          where: {
            userId_planId: {
              userId: ctx.session.user.id,
              planId: input.planId,
            },
          },
          update: {
            quantity: {
              increment: input.quantity,
            },
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
        })
      })

      return cartItem
    }),

  updateQuantity: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user session and ID
      if (!ctx.session?.user?.id || ctx.session.user.id === '') {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Invalid user session. Please sign in again.' 
        })
      }

      const cartItem = await ctx.db.cartItem.findUnique({
        where: {
          userId_planId: {
            userId: ctx.session.user.id,
            planId: input.planId,
          },
        },
        include: {
          plan: true,
        },
      })

      if (!cartItem) {
        throw new TRPCError({ 
          code: 'NOT_FOUND', 
          message: 'Cart item not found' 
        })
      }

      // Check stock quantity if limited
      if (cartItem.plan.stockQuantity !== null && cartItem.plan.stockQuantity < input.quantity) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Insufficient stock' 
        })
      }

      const updatedItem = await ctx.db.cartItem.update({
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
      })

      return updatedItem
    }),

  remove: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user session and ID
      if (!ctx.session?.user?.id || ctx.session.user.id === '') {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Invalid user session. Please sign in again.' 
        })
      }

      await ctx.db.cartItem.delete({
        where: {
          userId_planId: {
            userId: ctx.session.user.id,
            planId: input.planId,
          },
        },
      })

      return { success: true }
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    // Validate user session and ID
    if (!ctx.session?.user?.id || ctx.session.user.id === '') {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED', 
        message: 'Invalid user session. Please sign in again.' 
      })
    }

    await ctx.db.cartItem.deleteMany({
      where: {
        userId: ctx.session.user.id,
      },
    })

    return { success: true }
  }),

  getCount: protectedProcedure.query(async ({ ctx }) => {
    // Validate user session and ID
    if (!ctx.session?.user?.id || ctx.session.user.id === '') {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED', 
        message: 'Invalid user session. Please sign in again.' 
      })
    }

    const result = await ctx.db.cartItem.aggregate({
      where: {
        userId: ctx.session.user.id,
      },
      _sum: {
        quantity: true,
      },
    })

    return result._sum.quantity || 0
  }),
}) 