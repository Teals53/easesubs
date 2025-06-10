import crypto from "crypto";

export interface WeepayConfig {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  isSandbox?: boolean;
}

export interface WeepayPaymentRequest {
  order_id: string;
  amount: number;
  currency: string;
  return_url: string;
  notify_url: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  lang?: string;
}

export interface WeepayPaymentResponse {
  success: boolean;
  payment_id?: string;
  payment_url?: string;
  order_id?: string;
  status?: string;
  error?: string;
  message?: string;
}

export interface WeepayWebhookData {
  order_id: string;
  payment_id: string;
  amount: string;
  currency: string;
  status: string;
  transaction_id?: string;
  customer_name?: string;
  customer_email?: string;
  signature: string;
}

export interface WeepayPaymentStatusResponse {
  success: boolean;
  payment_id?: string;
  order_id?: string;
  amount?: string;
  currency?: string;
  status?: string;
  transaction_id?: string;
  created_at?: string;
  updated_at?: string;
  error?: string;
  message?: string;
}

export class Weepay {
  private config: WeepayConfig;

  constructor(config: WeepayConfig) {
    this.config = config;
  }

  /**
   * Generate signature for weepay requests
   */
  private generateSignature(data: Record<string, string | number>): string {
    // Sort parameters alphabetically and concatenate
    const sortedKeys = Object.keys(data).sort();
    const signatureString =
      sortedKeys.map((key) => `${key}=${data[key]}`).join("&") +
      `&secret=${this.config.secretKey}`;

    return crypto.createHash("md5").update(signatureString).digest("hex");
  }

  /**
   * Verify webhook signature
   */
  public static verifyWebhookSignature(
    data: WeepayWebhookData,
    secretKey: string,
  ): boolean {
    try {
      const { signature, ...payloadData } = data;

      // Create signature string
      const sortedKeys = Object.keys(payloadData).sort();
      const signatureString =
        sortedKeys
          .map(
            (key) => `${key}=${payloadData[key as keyof typeof payloadData]}`,
          )
          .join("&") + `&secret=${secretKey}`;

      const expectedSignature = crypto
        .createHash("md5")
        .update(signatureString)
        .digest("hex");

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  /**
   * Create a payment session using weepay.co API format
   */
  async createPayment(
    paymentData: WeepayPaymentRequest,
  ): Promise<WeepayPaymentResponse> {
    try {
      const requestData = {
        Auth: {
          bayiId: this.config.merchantId,
          apiKey: this.config.apiKey,
          secretKey: this.config.secretKey,
        },
        Data: {
          orderId: paymentData.order_id,
          currency: paymentData.currency,
          locale: paymentData.lang || "tr",
          paidPrice: paymentData.amount.toString(),
          ipAddress: "192.168.1.1", // Default IP, should be passed from request
          description: paymentData.description || "Payment for order",
          callBackUrl: paymentData.return_url,
        },
        Customer: {
          customerId: "1",
          customerName: paymentData.customer_name
            ? paymentData.customer_name.split(" ")[0] || "Customer"
            : "Customer",
          customerSurname: paymentData.customer_name
            ? paymentData.customer_name.split(" ").slice(1).join(" ") || "Test"
            : "Test",
          gsmNumber: paymentData.customer_phone || "5555555555",
          email: paymentData.customer_email || "customer@example.com",
          identityNumber: "11111111111",
          city: "Istanbul",
          country: "Turkey",
        },
        BillingAddress: {
          contactName: paymentData.customer_name || "Customer Test",
          address: "Default Address",
          city: "Istanbul",
          country: "Turkey",
          zipCode: 34000,
        },
        ShippingAddress: {
          contactName: paymentData.customer_name || "Customer Test",
          address: "Default Address",
          city: "Istanbul",
          country: "Turkey",
          zipCode: 34000,
        },
        Products: [
          {
            productId: "PRODUCT_1",
            name: "Payment Product",
            productPrice: paymentData.amount.toString(),
            itemType: "VIRTUAL",
          },
        ],
      };

      const response = await fetch(
        `${this.config.baseUrl}/Payment/PaymentCreate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${responseText}`,
        );
      }

      const result = JSON.parse(responseText);

      if (result.status === "success") {
        return {
          success: true,
          payment_id: result.paymentId,
          payment_url: result.paymentPageUrl,
          order_id: paymentData.order_id,
          status: "pending",
        };
      } else {
        return {
          success: false,
          error: result.message || result.error || "Payment creation failed",
          message: result.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get payment status using weepay.co API format
   */
  async getPaymentStatus(
    paymentId: string,
    orderId?: string,
  ): Promise<WeepayPaymentStatusResponse> {
    try {
      const requestData = {
        Auth: {
          bayiId: this.config.merchantId,
          apiKey: this.config.apiKey,
          secretKey: this.config.secretKey,
        },
        Data: {
          paymentId: paymentId,
          ...(orderId && { orderId: orderId }),
        },
      };

      const response = await fetch(
        `${this.config.baseUrl}/Payment/PaymentDetail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        return {
          success: true,
          payment_id: result.paymentId,
          order_id: result.orderId,
          amount: result.amount,
          currency: result.currency,
          status: result.paymentStatus ? "completed" : "failed",
          transaction_id: result.transactionId,
          created_at: result.createdAt,
          updated_at: result.updatedAt,
        };
      } else {
        return {
          success: false,
          error:
            result.message || result.error || "Failed to get payment status",
          message: result.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
