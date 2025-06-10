import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

export const paymentRouter = createTRPCRouter({
  // Payment creation is now handled by dedicated API routes:
  // - /api/payment/cryptomus/create
  // This provides better separation and allows provider-specific logic

  getPayment: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findFirst({
        where: {
          id: input.paymentId,
          order: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      return payment;
    }),

  getOrderPayments: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payments = await ctx.db.payment.findMany({
        where: {
          orderId: input.orderId,
          order: {
            userId: ctx.session.user.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return payments;
    }),

  // Webhook handler for payment providers
  handleWebhook: publicProcedure
    .input(
      z.object({
        provider: z.enum(["CRYPTOMUS"]),
        paymentId: z.string(),
        status: z.enum(["COMPLETED", "FAILED", "CANCELLED"]),
        providerData: z.record(z.any()).optional(),
        signature: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify webhook signature based on provider
      const isValidSignature = await verifyWebhookSignature(
        input.provider,
        input.signature,
        input.providerData,
      );

      if (!isValidSignature) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid webhook signature",
        });
      }

      const payment = await ctx.db.payment.findUnique({
        where: { id: input.paymentId },
        include: { order: true },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      // Update payment status
      const updatedPayment = await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: {
          status: input.status,
          webhookData: input.providerData,
          completedAt: input.status === "COMPLETED" ? new Date() : undefined,
          failureReason:
            input.status === "FAILED" ? "Payment failed" : undefined,
        },
      });

      // Update order status based on payment status
      if (input.status === "COMPLETED") {
        await ctx.db.order.update({
          where: { id: payment.orderId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        // Create subscriptions for completed orders
        const orderItems = await ctx.db.orderItem.findMany({
          where: { orderId: payment.orderId },
          include: { plan: true },
        });

        for (const item of orderItems) {
          const startDate = new Date();
          const endDate = new Date(
            startDate.getTime() + item.plan.duration * 24 * 60 * 60 * 1000,
          );

          await ctx.db.userSubscription.create({
            data: {
              userId: payment.order.userId,
              planId: item.planId,
              orderId: payment.orderId,
              status: "ACTIVE",
              startDate,
              endDate,
              renewalDate: endDate,
              price: item.price,
              billingPeriod: item.plan.billingPeriod,
            },
          });
        }
      } else if (input.status === "FAILED") {
        await ctx.db.order.update({
          where: { id: payment.orderId },
          data: { status: "FAILED" },
        });
      }

      return updatedPayment;
    }),

  refundPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        amount: z.number().positive().optional(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findFirst({
        where: {
          id: input.paymentId,
          order: {
            userId: ctx.session.user.id,
          },
          status: "COMPLETED",
        },
        include: { order: true },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found or not eligible for refund",
        });
      }

      const refundAmount = input.amount || Number(payment.amount);

      // Process actual refund with payment provider
      try {
        await processRefundWithProvider(payment.method);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process refund",
        });
      }

      // Update payment record
      const updatedPayment = await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: {
          status:
            refundAmount === Number(payment.amount)
              ? "REFUNDED"
              : "PARTIALLY_REFUNDED",
          refundAmount,
          refundedAt: new Date(),
        },
      });

      // Update order status
      await ctx.db.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED" },
      });

      // Cancel related subscriptions
      await ctx.db.userSubscription.updateMany({
        where: { orderId: payment.orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      return updatedPayment;
    }),
});

// Helper function to verify webhook signatures
async function verifyWebhookSignature(
  provider: "CRYPTOMUS",
  signature?: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  if (!signature || !data) return false;

  switch (provider) {
    case "CRYPTOMUS":
      const cryptomusSecret = process.env.CRYPTOMUS_SECRET_KEY;
      if (!cryptomusSecret) return false;

      // Cryptomus signature verification
      const cryptomusPayload = JSON.stringify(data);
      const cryptomusExpectedSignature = crypto
        .createHmac("md5", cryptomusSecret)
        .update(cryptomusPayload)
        .digest("hex");

      return signature === cryptomusExpectedSignature;

    default:
      return false;
  }
}

// Helper function to process refunds with payment providers
async function processRefundWithProvider(method: string): Promise<void> {
  switch (method) {
    case "CRYPTOMUS":
      // Implement Cryptomus refund API call
      // This would make an actual API call to Cryptomus's refund endpoint
      // Processing Cryptomus refund
      break;

    default:
      throw new Error(`Unsupported payment method for refund: ${method}`);
  }
}
