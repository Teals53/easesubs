import { NextRequest, NextResponse } from "next/server";
import { getIyzico } from "@/lib/iyzico-wrapper";

interface IyzicoCallbackResult {
  status: string;
  paymentStatus?: string;
  paymentId?: string;
  conversationId?: string;
  price?: string | number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: { token?: string } = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing payment token" },
        { status: 400 }
      );
    }

    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment configuration error" },
        { status: 500 }
      );
    }

    const Iyzipay = await getIyzico();
    const iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: baseUrl,
    });

    // Retrieve checkout form result
    const retrieveRequest = {
      locale: "TR" as const,
      token: token,
    };

    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutForm.retrieve(retrieveRequest, async (err: unknown, result: IyzicoCallbackResult) => {
        if (err) {
          console.error("iyzico callback error:", err);
          resolve(NextResponse.json(
            { success: false, error: "Payment verification failed" },
            { status: 400 }
          ));
          return;
        }

        console.log("iyzico callback result:", result);
        console.log("Searching for payment with conversationId:", result.conversationId);
        console.log("Searching for payment with paymentId:", result.paymentId);
        
        // Update payment and order status in database based on payment result
        try {
          const { db } = await import("@/lib/db");
          const { DeliveryService } = await import("@/lib/delivery-service");
          
          // Find payment record by conversation ID
          // The conversationId should now be the payment ID (based on updated create flow)
          const payment = await db.payment.findFirst({
            where: {
              OR: [
                { id: result.conversationId },      // Primary: conversationId is payment ID  
                { providerPaymentId: result.paymentId },
                { orderId: result.conversationId }, // Fallback: if conversationId is order ID
                { order: { id: result.conversationId } },
                { order: { orderNumber: result.conversationId } },
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
            console.error("Payment not found for Iyzico callback:", {
              conversationId: result.conversationId,
              paymentId: result.paymentId,
            });
            
            // Try to find any related records for debugging
            const orderByNumber = await db.order.findFirst({
              where: { orderNumber: result.conversationId },
              include: { items: true }
            });
            const orderById = await db.order.findFirst({
              where: { id: result.conversationId },
              include: { items: true }
            });
            const paymentById = await db.payment.findFirst({
              where: { id: result.conversationId }
            });
            
            console.log("Debug - Order by number:", orderByNumber);
            console.log("Debug - Order by ID:", orderById);
            console.log("Debug - Payment by ID:", paymentById);
            
            resolve(NextResponse.json({
              success: false,
              error: "Payment record not found",
              debug: {
                conversationId: result.conversationId,
                paymentId: result.paymentId,
                foundOrderByNumber: !!orderByNumber,
                foundOrderById: !!orderById,
                foundPaymentById: !!paymentById,
              }
            }));
            return;
          }

          // Map Iyzico status to our status
          let paymentStatus: "COMPLETED" | "FAILED" | "CANCELLED" = "FAILED";
          let orderStatus: "COMPLETED" | "FAILED" | "CANCELLED" = "FAILED";

          if (result.status === "success" && result.paymentStatus === "SUCCESS") {
            paymentStatus = "COMPLETED";
            orderStatus = "COMPLETED";
          } else {
            paymentStatus = "FAILED";
            orderStatus = "FAILED";
          }

          // Update payment and order in transaction
          await db.$transaction(async (tx) => {
            // Update payment record
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: paymentStatus,
                providerPaymentId: result.paymentId,
                webhookData: JSON.parse(JSON.stringify(result)),
                completedAt: paymentStatus === "COMPLETED" ? new Date() : undefined,
                failureReason: paymentStatus === "FAILED" 
                  ? (result.errorMessage || "Payment failed") 
                  : undefined,
              },
            });

            // Update order status
            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                status: orderStatus,
                completedAt: orderStatus === "COMPLETED" ? new Date() : undefined,
              },
            });

                         // If payment successful, process delivery for each order item
             if (paymentStatus === "COMPLETED") {
               try {
                 for (const item of payment.order.items) {
                   await DeliveryService.processDelivery({
                     orderId: payment.orderId,
                     orderItemId: item.id,
                   });
                 }
               } catch (deliveryError) {
                 console.error("Delivery processing failed:", deliveryError);
                 // Don't fail the payment, just log the error
               }
             }
          });

          console.log(`Iyzico payment ${paymentStatus.toLowerCase()}:`, {
            paymentId: payment.id,
            orderId: payment.orderId,
            status: paymentStatus,
          });

          // Success response
          resolve(NextResponse.json({
            success: true,
            paymentStatus: result.paymentStatus,
            paymentId: payment.id,
            providerPaymentId: result.paymentId,
            orderId: payment.orderId,
            conversationId: result.conversationId,
          }));

        } catch (dbError) {
          console.error("Database update failed in Iyzico callback:", dbError);
          resolve(NextResponse.json({
            success: false,
            error: "Database update failed",
          }));
          return;
        }
      });
    });

  } catch (error) {
    console.error("iyzico callback API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during callback processing",
      },
      { status: 500 }
    );
  }
} 