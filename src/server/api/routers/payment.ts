import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { PaymentProviders } from "@/lib/payment-providers";

export const paymentRouter = createTRPCRouter({
  createPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        method: z.enum(["CRYPTOMUS", "IYZICO"]),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        returnUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify order belongs to user
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
          message: "Order not found or not pending",
        });
      }

      // Create payment record
      const payment = await ctx.db.payment.create({
        data: {
          orderId: input.orderId,
          method: input.method,
          amount: input.amount,
          currency: input.currency,
          status: "PENDING",
          providerData: {
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
          },
        },
      });

      // Integrate with payment providers
      let paymentUrl = "";
      let paymentInstructions = "";
      let providerPaymentId = "";

      try {
        switch (input.method) {
          case "CRYPTOMUS":
            const cryptomusResult =
              await PaymentProviders.createCryptomusPayment({
                orderId: payment.id,
                amount: input.amount,
                currency: input.currency,
                returnUrl:
                  input.returnUrl ||
                  `${process.env.NEXTAUTH_URL}/dashboard/orders/${order.id}`,
                callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`,
              });

            if (!cryptomusResult.success) {
              throw new Error(
                cryptomusResult.error || "Cryptomus payment creation failed",
              );
            }

            paymentUrl = cryptomusResult.paymentUrl || "";
            providerPaymentId = cryptomusResult.paymentId || "";
            paymentInstructions =
              "Redirecting to Cryptomus for secure crypto payment...";
            break;

          case "IYZICO":
            // For Iyzico, we need to collect user details first before creating checkout
            // This should be handled by a separate frontend flow that calls the /api/payment/iyzico/create endpoint
            throw new Error(
              "Iyzico payments require user details. Use the dedicated Iyzico checkout flow."
            );
        }

        // Update payment with provider data
        if (providerPaymentId) {
          await ctx.db.payment.update({
            where: { id: payment.id },
            data: {
              providerPaymentId,
              providerData: {
                ...(payment.providerData as Record<string, unknown>),
                providerPaymentId,
                paymentUrl,
              },
            },
          });
        }

        return {
          paymentId: payment.id,
          paymentUrl,
          paymentInstructions,
          status: payment.status,
        };
      } catch (error) {
        // Update payment status to failed
        await ctx.db.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failureReason:
              error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Payment creation failed",
        });
      }
    }),

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
        provider: z.enum(["CRYPTOMUS", "IYZICO"]),
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
        await processRefundWithProvider(
          payment.method,
          payment.id,
          refundAmount,
          input.reason,
        );
      } catch (refundError) {
        console.error("Refund processing error:", refundError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process refund with payment provider",
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
  provider: "CRYPTOMUS" | "IYZICO",
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

    case "IYZICO":
      // Iyzico uses token-based validation handled in the callback route
      // The callback endpoint validates the token with Iyzico directly
      return true;

    default:
      return false;
  }
}

// Helper function to process refunds with payment providers
async function processRefundWithProvider(
  method: string,
  paymentId: string,
  amount: number,
  reason?: string,
): Promise<void> {
  switch (method) {
    case "CRYPTOMUS":
      // Implement Cryptomus refund API call
      // This would make an actual API call to Cryptomus's refund endpoint
      console.log(
        `Processing Cryptomus refund for payment ${paymentId}, amount: ${amount}, reason: ${reason || "No reason provided"}`,
      );
      break;

    case "IYZICO":
      // Use the Iyzico refund function from PaymentProviders
      try {
        const { PaymentProviders } = await import("@/lib/payment-providers");
        const result = await PaymentProviders.refundIyzicoPayment(
          paymentId,
          amount,
          "TRY", // Default currency, could be made dynamic
          paymentId // Use paymentId as conversationId
        );
        
        if (!result.success) {
          throw new Error(result.error || "Iyzico refund failed");
        }
        
        console.log(`Iyzico refund successful: ${result.refundId}`);
      } catch (error) {
        console.error("Iyzico refund error:", error);
        throw error;
      }
      break;

    default:
      throw new Error(`Unsupported payment method for refund: ${method}`);
  }
}
