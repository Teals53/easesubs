import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webhookRateLimit } from "@/lib/enhanced-rate-limit";
import { emailService } from "@/lib/email";
import { CryptomusWebhook } from "@/lib/cryptomus";
import { DeliveryService } from "@/lib/delivery-service";

async function verifyWebhookSignature(
  body: string,
  signature: string,
): Promise<boolean> {
  const cryptomusSecret = process.env.CRYPTOMUS_PAYMENT_API_KEY;
  if (!cryptomusSecret) {
    return false;
  }

  const crypto = await import("crypto");
  const expectedSignature = crypto
    .createHash("md5")
    .update(body + cryptomusSecret)
    .digest("hex");

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = webhookRateLimit.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many webhook requests" },
        { status: 429 },
      );
    }

    const body = await request.text();
    const signature = request.headers.get("sign");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const apiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    if (!(await verifyWebhookSignature(body, signature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Parse webhook data
    const webhookData: CryptomusWebhook = JSON.parse(body);
    const { order_id, status, uuid } = webhookData;

    if (!uuid || !order_id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find payment record
    // The order_id from Cryptomus should be the order number (based on updated create flow)
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { order: { orderNumber: order_id } }, // Primary: order_id is order number
          { providerPaymentId: uuid }, // Secondary: by provider payment ID
          { id: order_id }, // Fallback: order_id is payment ID (legacy)
        ],
      },
      include: {
        order: {
          include: {
            user: true,
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
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    let paymentStatus: "COMPLETED" | "FAILED" | "PROCESSING" | "CANCELLED";
    let orderStatus: "COMPLETED" | "FAILED" | "PROCESSING" | "CANCELLED";

    switch (status) {
      case "paid":
      case "paid_over":
        paymentStatus = "COMPLETED";
        orderStatus = "COMPLETED";
        break;
      case "fail":
      case "wrong_amount":
      case "cancel":
        paymentStatus = "FAILED";
        orderStatus = "FAILED";
        break;
      case "check":
      case "process":
        paymentStatus = "PROCESSING";
        orderStatus = "PROCESSING";
        break;
      case "refund_paid":
        paymentStatus = "CANCELLED";
        orderStatus = "CANCELLED";
        break;
      case "refund_process":
      case "refund_fail":
        // Keep current status for refund processing states
        return NextResponse.json({ success: true });
      default:
        // For unknown statuses, don't update
        return NextResponse.json({ success: true });
    }

    // Enhanced payment processing with stock validation
    const updatedPayment = await db.$transaction(async (tx) => {
      // If payment is being completed, validate stock availability first
      if (paymentStatus === "COMPLETED") {
        const stockValidationErrors = [];

        for (const item of payment.order.items) {
          if (item.plan.deliveryType === "AUTOMATIC") {
            const availableStock = await tx.stockItem.count({
              where: {
                planId: item.planId,
                isUsed: false,
              },
            });

            if (availableStock < item.quantity) {
              stockValidationErrors.push({
                productName: item.plan.product.name,
                planType: item.plan.planType,
                requested: item.quantity,
                available: availableStock,
              });
            }
          }
        }

        // If stock validation fails, cancel the order instead of completing it
        if (stockValidationErrors.length > 0) {
          // Update payment as completed but order as cancelled due to stock
          const updatedPaymentRecord = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              providerPaymentId: uuid,
              webhookData: JSON.parse(JSON.stringify(webhookData)),
              completedAt: new Date(),
              failureReason: `Stock no longer available: ${stockValidationErrors.map((e) => `${e.productName} (${e.available}/${e.requested})`).join(", ")}`,
            },
          });

          const cancelledOrderRecord = await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status: "CANCELLED",
              completedAt: new Date(),
            },
          });

          // Clear user's cart items for the cancelled products
          const planIds = payment.order.items.map(
            (item: (typeof payment.order.items)[0]) => item.planId,
          );
          await tx.cartItem.deleteMany({
            where: {
              userId: payment.order.userId,
              planId: { in: planIds },
            },
          });

          return {
            payment: updatedPaymentRecord,
            order: cancelledOrderRecord,
            stockConflict: true,
            stockErrors: stockValidationErrors,
          };
        }
      }

      // Normal payment processing if no stock issues
      const updatedPaymentRecord = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerPaymentId: uuid,
          webhookData: JSON.parse(JSON.stringify(webhookData)),
          completedAt: paymentStatus === "COMPLETED" ? new Date() : undefined,
          failureReason:
            paymentStatus === "FAILED"
              ? `Payment failed: ${status}`
              : undefined,
        },
      });

      const updatedOrderRecord = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
          completedAt: orderStatus === "COMPLETED" ? new Date() : undefined,
        },
      });

      // Create subscriptions if payment completed
      if (paymentStatus === "COMPLETED") {
        const orderWithItems = await tx.order.findUnique({
          where: { id: payment.orderId },
          include: {
            items: {
              include: { plan: true },
            },
          },
        });

        if (orderWithItems) {
          for (const item of orderWithItems.items) {
            await tx.userSubscription.create({
              data: {
                userId: orderWithItems.userId,
                planId: item.planId,
                orderId: payment.orderId,
                status: "ACTIVE",
                startDate: new Date(),
                endDate: new Date(
                  Date.now() + item.plan.duration * 24 * 60 * 60 * 1000,
                ),
                renewalDate: new Date(
                  Date.now() + item.plan.duration * 24 * 60 * 60 * 1000,
                ),
                price: item.price,
                currency: item.currency,
                billingPeriod: item.plan.billingPeriod,
                autoRenew: true,
              },
            });
          }
        }
      }

      return { payment: updatedPaymentRecord, order: updatedOrderRecord };
    });

    // Send email notification for completed orders
    if (paymentStatus === "COMPLETED" && payment.order.user.email) {
      try {
        const orderItems = payment.order.items.map(
          (item: (typeof payment.order.items)[0]) => ({
            productName: item.plan.product.name,
            planName: item.plan.name,
            price: Number(item.price),
          }),
        );

        await emailService.sendOrderConfirmation(
          payment.order.user.email,
          payment.order.orderNumber,
          Number(payment.order.total),
          orderItems,
        );
      } catch {
        // Email sending failed - continue processing
      }
    }

    // Process deliveries for completed orders
    if (paymentStatus === "COMPLETED" && !updatedPayment.stockConflict) {
      try {
        for (const item of payment.order.items) {
          try {
            await DeliveryService.processDelivery({
              orderId: payment.order.id,
              orderItemId: item.id,
            });
          } catch {
            // Continue with other items even if one fails
          }
        }

        // Cancel conflicting orders for the same products
        try {
          const automaticPlanIds = payment.order.items
            .filter(
              (item: (typeof payment.order.items)[0]) =>
                item.plan.deliveryType === "AUTOMATIC",
            )
            .map((item: (typeof payment.order.items)[0]) => item.planId);

          if (automaticPlanIds.length > 0) {
            // Find and cancel conflicting orders directly with database queries
            const conflictingOrders = await db.order.findMany({
              where: {
                id: { not: payment.order.id },
                status: "PENDING",
                items: {
                  some: {
                    planId: { in: automaticPlanIds },
                    plan: { deliveryType: "AUTOMATIC" },
                  },
                },
              },
              include: {
                items: {
                  include: {
                    plan: { include: { product: true } },
                  },
                },
              },
            });

            for (const order of conflictingOrders) {
              // Check stock conflicts for this order
              const hasStockConflict = await Promise.all(
                order.items.map(async (item: (typeof order.items)[0]) => {
                  if (item.plan.deliveryType === "AUTOMATIC") {
                    const availableStock = await db.stockItem.count({
                      where: { planId: item.planId, isUsed: false },
                    });
                    return availableStock < item.quantity;
                  }
                  return false;
                }),
              );

              if (hasStockConflict.some(Boolean)) {
                // Cancel this order
                await db.$transaction([
                  db.order.update({
                    where: { id: order.id },
                    data: { status: "CANCELLED", completedAt: new Date() },
                  }),
                  db.payment.updateMany({
                    where: { orderId: order.id, status: "PENDING" },
                    data: {
                      status: "CANCELLED",
                      failureReason: "Order cancelled due to stock conflict",
                      completedAt: new Date(),
                    },
                  }),
                ]);
              }
            }
          }
        } catch {
          // Don't fail the webhook for conflict resolution errors
        }
      } catch {
        // Don't fail the webhook for delivery errors
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
