import { NextRequest, NextResponse } from "next/server";
import { PaymentProviders } from "@/lib/payment-providers";
import { auth } from "@/lib/auth";

interface CryptomusCheckoutRequest {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body: CryptomusCheckoutRequest = await request.json();

    // Validate required fields
    if (!body.orderId || !body.amount) {
      return NextResponse.json(
        { success: false, error: "Missing required payment information" },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Verify the order exists and belongs to the user
    const { db } = await import("@/lib/db");
    
    const order = await db.order.findFirst({
      where: {
        id: body.orderId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or not pending" },
        { status: 404 }
      );
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        orderId: body.orderId,
        method: "CRYPTOMUS",
        amount: body.amount,
        currency: body.currency,
        status: "PENDING",
        providerData: {
          returnUrl: body.returnUrl,
          callbackUrl: body.callbackUrl,
        },
      },
    });

    // Create Cryptomus payment
    const result = await PaymentProviders.createCryptomusPayment({
      orderId: payment.id, // Use payment ID for tracking
      amount: body.amount,
      currency: body.currency,
      returnUrl: body.returnUrl || `${process.env.NEXTAUTH_URL}/dashboard/orders/${order.id}`,
      callbackUrl: body.callbackUrl || `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`,
    });

    if (result.success) {
      // Update payment with Cryptomus payment ID
      await db.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: result.paymentId,
          providerData: {
            ...(payment.providerData as Record<string, unknown>),
            paymentId: result.paymentId,
            paymentUrl: result.paymentUrl,
          },
        },
      });

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        paymentUrl: result.paymentUrl,
        providerPaymentId: result.paymentId,
      });
    } else {
      // Update payment status to failed
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: result.error || "Payment creation failed",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Cryptomus checkout API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during checkout creation",
      },
      { status: 500 }
    );
  }
} 