import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentProviders } from "@/lib/payment-providers";
import { webhookRateLimit } from "@/lib/enhanced-rate-limit";
import { secureLogger } from "@/lib/secure-logger";
import { emailService } from "@/lib/email";
import { WeepayWebhookData } from "@/lib/weepay";
import { DeliveryService } from "@/lib/delivery-service";

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
    
    // Parse webhook data
    const webhookData: WeepayWebhookData = JSON.parse(body);
    const { order_id, payment_id, status, amount, currency, signature } = webhookData;

    // Validate webhook signature
    const secretKey = process.env.WEEPAY_SECRET_KEY;
    if (!secretKey) {
      secureLogger.error("WEEPAY_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 },
      );
    }

    const isValidSignature = PaymentProviders.verifyWeepayWebhook(webhookData, secretKey);
    if (!isValidSignature) {
      secureLogger.security("Invalid Weepay webhook signature", { 
        order_id,
        payment_id,
        hasSignature: !!signature 
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    secureLogger.payment("Valid Weepay webhook received", {
      order_id,
      payment_id,
      status,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });

    if (!order_id || !status || !payment_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find payment record
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { id: order_id },               // Primary: order_id is payment ID
          { providerPaymentId: payment_id }, // Secondary: by provider payment ID
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
      secureLogger.error("Payment not found for Weepay webhook", {
        paymentId: order_id,
        status: status
      });
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    secureLogger.payment("Current payment status check", {
      paymentId: order_id,
      currentStatus: payment.status,
      webhookStatus: status
    });

    // Map Weepay status to our status
    let paymentStatus: "COMPLETED" | "FAILED" | "CANCELLED" = "FAILED";
    let orderStatus: "COMPLETED" | "FAILED" | "CANCELLED" = "FAILED";

    switch (status.toLowerCase()) {
      case "success":
      case "completed":
      case "paid":
        paymentStatus = "COMPLETED";
        orderStatus = "COMPLETED";
        break;
      case "failed":
      case "error":
      case "declined":
        paymentStatus = "FAILED";
        orderStatus = "FAILED";
        break;
      case "cancelled":
      case "canceled":
      case "refunded":
        paymentStatus = "CANCELLED";
        orderStatus = "CANCELLED";
        break;
      case "pending":
      case "processing":
        // Keep current status for pending states
        secureLogger.info("Pending payment webhook received, keeping current status", {
          paymentId: order_id,
          status: status
        });
        return NextResponse.json({ received: true });
      default:
        // For unknown statuses, don't update
        secureLogger.warn("Unknown Weepay payment status received", {
          paymentId: order_id,
          status: status
        });
        return NextResponse.json({ received: true });
    }

    // Enhanced payment processing with stock validation
    await db.$transaction(async (tx) => {
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
          secureLogger.warn("Order stock validation failed", {
            orderId: payment.orderId,
            conflictingItems: stockValidationErrors.length
          });

          // Update payment as completed but order as cancelled due to stock
          const updatedPaymentRecord = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              providerPaymentId: payment_id,
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

          // Send stock unavailable notification
          try {
            await emailService.sendEmail({
              to: payment.order.user.email,
              subject: "Order Cancelled - Stock Unavailable",
              text: `Your order ${payment.order.orderNumber} has been cancelled because some items are no longer in stock. Your payment has been processed and a refund will be issued.`,
              html: `
                <h2>Order Cancelled - Stock Unavailable</h2>
                <p>Dear ${payment.order.user.name || "Customer"},</p>
                <p>Your order <strong>${payment.order.orderNumber}</strong> has been cancelled because the following items are no longer in stock:</p>
                <ul>
                  ${stockValidationErrors.map((e) => `<li>${e.productName} - Requested: ${e.requested}, Available: ${e.available}</li>`).join("")}
                </ul>
                <p>Your payment has been processed and a refund will be issued within 3-5 business days.</p>
                <p>We apologize for the inconvenience.</p>
              `,
            });
          } catch (emailError) {
            secureLogger.error("Failed to send stock unavailable email", emailError);
          }

          return { payment: updatedPaymentRecord, order: cancelledOrderRecord };
        }
      }

      // Update payment status
      const updatedPaymentRecord = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerPaymentId: payment_id,
          webhookData: JSON.parse(JSON.stringify(webhookData)),
          completedAt: paymentStatus === "COMPLETED" ? new Date() : undefined,
        },
      });

      // Update order status
      const updatedOrderRecord = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
          completedAt: orderStatus === "COMPLETED" ? new Date() : undefined,
        },
      });

      return { payment: updatedPaymentRecord, order: updatedOrderRecord };
    });

    // Handle post-payment processing
    if (paymentStatus === "COMPLETED") {
      try {
        // Process deliveries for all order items
        for (const item of payment.order.items) {
          try {
            await DeliveryService.processDelivery({
              orderId: payment.order.id,
              orderItemId: item.id,
            });
          } catch (deliveryError) {
            secureLogger.error("Failed to process delivery for item", deliveryError, {
              action: "delivery_processing"
            });
            // Continue with other items even if one fails
          }
        }

        // Send confirmation email
        await emailService.sendEmail({
          to: payment.order.user.email,
          subject: `Order Confirmed - ${payment.order.orderNumber}`,
          text: `Your order ${payment.order.orderNumber} has been confirmed and is being processed.`,
          html: `
            <h2>Order Confirmed</h2>
            <p>Dear ${payment.order.user.name || "Customer"},</p>
            <p>Your order <strong>${payment.order.orderNumber}</strong> has been confirmed and is being processed.</p>
            <p>Order Total: ${payment.order.total} ${payment.order.currency}</p>
            <p>You can track your order status in your dashboard.</p>
          `,
        });

        secureLogger.info("Order completed successfully", {
          orderId: payment.order.id,
          paymentId: payment.id,
          totalAmount: payment.amount
        });
      } catch (error) {
        secureLogger.error("Error in post-payment processing", error, {
          action: "post_payment_processing"
        });
        // Don't fail the webhook for post-processing errors
      }
    }

    // Log webhook processing completion
    secureLogger.payment("Weepay webhook processed successfully", {
      orderId: payment.order.id,
      orderNumber: payment.order.orderNumber,
      paymentStatus,
      orderStatus,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
          secureLogger.error("Weepay webhook processing error", error, {
        action: "webhook_processing"
      });
    
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
} 