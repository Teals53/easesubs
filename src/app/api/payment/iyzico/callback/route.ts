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

// Helper function to get the correct base URL for redirects
function getBaseUrl(request?: NextRequest): string {
  // In production, always use NEXTAUTH_URL if it's set to a real domain
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl && !nextAuthUrl.includes('localhost')) {
    return nextAuthUrl;
  }
  
  // For local development, use the request origin
  if (request) {
    const requestUrl = new URL(request.url);
    const host = requestUrl.host;
    // Only use request URL if it's actually localhost
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `${requestUrl.protocol}//${requestUrl.host}`;
    }
  }
  
  // Fallback to NEXTAUTH_URL or localhost
  return nextAuthUrl || 'http://localhost:3000';
}

async function handleIyzicoCallback(token: string, isBrowserRequest: boolean = false, originalRequest?: NextRequest): Promise<NextResponse> {
  try {
    console.log("🔵 Processing Iyzico callback with token:", token);

    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

    if (!apiKey || !secretKey) {
      console.log("❌ Missing Iyzico credentials");
      if (isBrowserRequest) {
        // Redirect to orders page with error
        return NextResponse.redirect(new URL('/dashboard/orders?error=configuration', getBaseUrl(originalRequest)));
      }
      return NextResponse.json(
        { success: false, error: "Payment configuration error" },
        { status: 500 }
      );
    }
    
    console.log("🔵 Iyzico credentials found, creating client");

    const Iyzipay = await getIyzico();
    const iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: baseUrl,
    });

    return new Promise((resolve) => {
      const request = {
        locale: "tr",
      token: token,
    };

      // @ts-expect-error - iyzico types may not include checkoutForm.retrieve
      iyzipay.checkoutForm.retrieve(request, async (err: Error | null, result: IyzicoCallbackResult) => {
        if (err) {
          console.error("Iyzico checkout form retrieve failed:", err);
          if (isBrowserRequest) {
            resolve(NextResponse.redirect(new URL('/dashboard/orders?error=payment_failed', getBaseUrl(originalRequest))));
          } else {
            resolve(NextResponse.json({
              success: false,
              error: "Payment verification failed",
            }));
          }
          return;
        }

        try {
          console.log("Iyzico payment result:", result);

          const { db } = await import("@/lib/db");
          const { DeliveryService } = await import("@/lib/delivery-service");
          
          // Find payment record by conversation ID or token
          // The conversationId should be the payment ID, but also check for token in providerData
          const payment = await db.payment.findFirst({
            where: {
              AND: [
                {
                  OR: [
                    { id: result.conversationId },      // Primary: conversationId is payment ID  
                    { providerPaymentId: result.paymentId },
                    // Check if token matches the token stored in providerData
                    {
                      providerData: {
                        path: ["token"],
                        equals: token,
                      },
                    },
                  ],
                },
                { method: "IYZICO" }, // Ensure we only match Iyzico payments
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
            
            if (isBrowserRequest) {
              resolve(NextResponse.redirect(new URL('/dashboard/orders?error=payment_not_found', getBaseUrl(originalRequest))));
            } else {
              resolve(NextResponse.json({
                success: false,
                error: "Payment record not found",
                debug: {
                  conversationId: result.conversationId,
                  paymentId: result.paymentId,
                }
              }));
            }
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

          // Ensure database consistency before redirecting
          // Wait a bit to ensure the transaction is fully committed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify the update was actually committed
          const updatedPayment = await db.payment.findUnique({
            where: { id: payment.id },
            select: { status: true },
          });
          
          if (!updatedPayment || updatedPayment.status !== paymentStatus) {
            console.error("Database consistency check failed:", {
              expected: paymentStatus,
              actual: updatedPayment?.status,
            });
            // Still proceed but log the issue
          }

          console.log(`Iyzico payment ${paymentStatus.toLowerCase()}:`, {
            paymentId: payment.id,
            orderId: payment.orderId,
            status: paymentStatus,
          });

          // Handle response based on request type
          if (isBrowserRequest) {
            // Redirect directly to orders page - much simpler and more reliable
            const baseUrl = getBaseUrl(originalRequest);
            const redirectUrl = new URL('/dashboard/orders', baseUrl);
            
            console.log(`🔵 Redirecting to orders page: ${redirectUrl.toString()}`);
            resolve(NextResponse.redirect(redirectUrl));
          } else {
            // Return JSON response for server callbacks
        resolve(NextResponse.json({
          success: true,
          paymentStatus: result.paymentStatus,
              paymentId: payment.id,
              providerPaymentId: result.paymentId,
              orderId: payment.orderId,
              conversationId: result.conversationId,
        }));
          }

        } catch (dbError) {
          console.error("Database update failed in Iyzico callback:", dbError);
          if (isBrowserRequest) {
            resolve(NextResponse.redirect(new URL('/dashboard/orders?error=database_error', getBaseUrl(originalRequest))));
          } else {
            resolve(NextResponse.json({
              success: false,
              error: "Database update failed",
            }));
          }
          return;
        }
      });
    });

  } catch (error) {
    console.error("❌ Iyzico callback API error:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "Unknown error");
    
    if (isBrowserRequest) {
      return NextResponse.redirect(new URL('/dashboard/orders?error=server_error', getBaseUrl(originalRequest)));
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during callback processing",
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("🔵 Iyzico callback received via GET");
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  console.log("🔵 GET Token:", token);
  
  if (!token) {
    return NextResponse.redirect(new URL('/dashboard/orders?error=missing_token', getBaseUrl(request)));
  }

  // GET requests are typically from browsers (users)
  return handleIyzicoCallback(token, true, request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("🔵 Iyzico callback received via POST");
  
  try {
    const contentType = request.headers.get('content-type') || '';
    const userAgent = request.headers.get('user-agent') || '';
    console.log("🔵 Content-Type:", contentType);
    console.log("🔵 User-Agent:", userAgent);
    
    let token: string | null = null;
    
    if (contentType.includes('application/json')) {
      // Handle JSON body
      try {
        const body: { token?: string } = await request.json();
        token = body.token || null;
        console.log("🔵 JSON body:", body);
      } catch (jsonError) {
        console.error("❌ Failed to parse JSON:", jsonError);
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      try {
        const formData = await request.formData();
        token = formData.get('token') as string || null;
        console.log("🔵 Form data token:", token);
        
        // Log all form data for debugging
        const allFormData: Record<string, string> = {};
        formData.forEach((value, key) => {
          allFormData[key] = value.toString();
        });
        console.log("🔵 All form data:", allFormData);
      } catch (formError) {
        console.error("❌ Failed to parse form data:", formError);
      }
    } else {
      // Try to read as text and parse manually
      try {
        const text = await request.text();
        console.log("🔵 Raw body text:", text);
        
        // Try to parse as URL-encoded
        if (text.includes('token=')) {
          const params = new URLSearchParams(text);
          token = params.get('token');
          console.log("🔵 URL-encoded token:", token);
        }
      } catch (textError) {
        console.error("❌ Failed to read as text:", textError);
      }
    }

    if (!token) {
      // Check if this looks like a browser request
      const isBrowserRequest = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
      if (isBrowserRequest) {
        return NextResponse.redirect(new URL('/dashboard/orders?error=missing_token', getBaseUrl(request)));
      }
      return NextResponse.json(
        { success: false, error: "Missing payment token" },
        { status: 400 }
      );
    }

    // Determine if this is a browser request or server callback
    const isBrowserRequest = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
    console.log("🔵 Is browser request:", isBrowserRequest);

    return handleIyzicoCallback(token, isBrowserRequest, request);
  } catch (error) {
    console.error("❌ Error processing POST callback:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}