import { NextRequest, NextResponse } from "next/server";
import { PaymentProviders } from "@/lib/payment-providers";
import { auth } from "@/lib/auth";

interface WeepayCheckoutRequest {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  notifyUrl?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse the request body
    const body: WeepayCheckoutRequest = await request.json();

    // Validate required fields
    if (!body.orderId || !body.amount) {
      return NextResponse.json(
        { success: false, error: "Missing required payment information" },
        { status: 400 },
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 },
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
      include: {
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or not pending" },
        { status: 404 },
      );
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        orderId: body.orderId,
        method: "WEEPAY",
        amount: body.amount,
        currency: body.currency || "TL",
        status: "PENDING",
        providerData: {
          returnUrl: body.returnUrl,
          notifyUrl: body.notifyUrl,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          description: body.description,
        },
      },
    });

    // Create Weepay payment
    const result = await PaymentProviders.createWeepayPayment({
      orderId: payment.id, // Use payment ID for tracking
      amount: body.amount,
      currency: body.currency || "TL",
      returnUrl:
        body.returnUrl ||
        `${process.env.NEXTAUTH_URL}/dashboard/orders/${order.id}`,
      notifyUrl:
        body.notifyUrl || `${process.env.NEXTAUTH_URL}/api/webhooks/weepay`,
      customerName: body.customerName || order.user.name || "Customer",
      customerEmail: body.customerEmail || order.user.email || "",
      description: body.description || `Payment for order ${order.orderNumber}`,
    });

    if (result.success) {
      // Update payment with Weepay payment ID
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
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
