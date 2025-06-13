import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const paymentId = searchParams.get("paymentId");

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { error: "Either orderId or paymentId is required" },
        { status: 400 }
      );
    }

    // Find payment record using the same logic as webhook
    const payment = await db.payment.findFirst({
      where: orderId 
        ? {
            OR: [
              { order: { orderNumber: orderId } },
              { providerPaymentId: orderId },
              { id: orderId },
            ],
          }
        : paymentId 
          ? { id: paymentId }
          : undefined,
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
      return NextResponse.json(
        { 
          error: "Payment not found",
          searchCriteria: orderId ? {
            orderNumber: orderId,
            providerPaymentId: orderId,
            paymentId: orderId
          } : { paymentId }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        providerPaymentId: payment.providerPaymentId,
        providerData: payment.providerData,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      },
      order: {
        id: payment.order?.id,
        orderNumber: payment.order?.orderNumber,
        status: payment.order?.status,
        total: payment.order?.total,
        userId: payment.order?.userId,
        userEmail: payment.order?.user?.email,
        itemCount: payment.order?.items?.length || 0,
      }
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status = "paid" } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Create a test webhook payload
    const testWebhookPayload = {
      type: "payment",
      uuid: `test-${Date.now()}`,
      order_id: orderId,
      amount: "10.00",
      payment_amount: "10.00",
      merchant_amount: "9.50",
      commission: "0.50",
      is_final: true,
      status: status,
      currency: "USD",
      sign: "test-signature-will-be-validated"
    };

    // Send the test webhook to our own webhook endpoint
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`;
    
    console.log("Sending test webhook to:", webhookUrl);
    console.log("Test payload:", testWebhookPayload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testWebhookPayload),
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      success: true,
      testWebhookSent: true,
      webhookResponse: {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      },
      payload: testWebhookPayload,
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 