import { Cryptomus, CreatePaymentRequest } from "./cryptomus";
import { getIyzico } from "./iyzico-wrapper";

interface CryptomusPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  callbackUrl?: string;
}

// Updated interface for iyzico checkout form (hosted payment)
interface IyzicoCheckoutData {
  orderId: string;
  amount: number;
  currency: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2?: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    price: string;
  }>;
  callbackUrl?: string;
}

// iyzico callback interfaces
interface IyzicoCheckoutResult {
  status: string;
  checkoutFormContent?: string;
  token?: string;
  tokenExpireTime?: number;
  paymentPageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface IyzicoError {
  message?: string;
}

interface IyzicoRefundResult {
  status: string;
  paymentId?: string;
  errorMessage?: string;
}

export class PaymentProviders {
  // Cryptomus Payment Integration
  static async createCryptomusPayment(data: CryptomusPaymentData): Promise<{
    success: boolean;
    paymentUrl?: string;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;
      const payoutApiKey = process.env.CRYPTOMUS_PAYOUT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error:
            "Payment processing is temporarily unavailable. Please contact support or try again later.",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
        payoutApiKey,
      });

      const paymentRequest: CreatePaymentRequest = {
        amount: data.amount.toString(),
        currency: data.currency,
        order_id: data.orderId,
        url_return: data.returnUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
        url_callback:
          data.callbackUrl ||
          `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`,
        is_payment_multiple: false,
        lifetime: 7200, // 2 hours
        accuracy_payment_percent: 5, // Allow 5% payment inaccuracy
      };

      const response = await cryptomus.createPayment(paymentRequest);

      if (response.state === 0 && response.result) {
        // Success
        return {
          success: true,
          paymentUrl: response.result.url,
          paymentId: response.result.uuid,
        };
      } else {
        throw new Error(
          response.message || "Cryptomus payment creation failed",
        );
      }
    } catch (error) {
      console.error("Cryptomus payment creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Verify Cryptomus webhook signature
  static verifyCryptomusWebhook(body: string, apiKey: string): boolean {
    return Cryptomus.validateWebhook(body, "", apiKey);
  }

  // Get payment information
  static async getCryptomusPaymentInfo(
    paymentId: string,
    orderId?: string,
  ): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.getPaymentInfo({
        uuid: paymentId,
        order_id: orderId,
      });

      if (response.state === 0 && response.result) {
        return {
          success: true,
          payment: response.result,
        };
      } else {
        throw new Error(response.message || "Failed to get payment info");
      }
    } catch (error) {
      console.error("Failed to get Cryptomus payment info:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get payment services
  static async getCryptomusPaymentServices(): Promise<{
    success: boolean;
    services?: unknown[];
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.getPaymentServices();

      if (response.state === 0 && response.result) {
        return {
          success: true,
          services: response.result,
        };
      } else {
        throw new Error(response.message || "Failed to get payment services");
      }
    } catch (error) {
      console.error("Failed to get Cryptomus payment services:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Refund payment
  static async refundCryptomusPayment(
    paymentId: string,
    address: string,
    orderId?: string,
    isSubtract = true,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.refundPayment({
        uuid: paymentId,
        order_id: orderId,
        address,
        is_subtract: isSubtract,
      });

      if (response.state === 0) {
        return { success: true };
      } else {
        throw new Error(response.message || "Refund failed");
      }
    } catch (error) {
      console.error("Cryptomus refund failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create static wallet
  static async createCryptomusWallet(
    currency: string,
    network: string,
    orderId: string,
    callbackUrl?: string,
  ): Promise<{
    success: boolean;
    wallet?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.createWallet({
        network,
        currency,
        order_id: orderId,
        url_callback:
          callbackUrl || `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`,
      });

      if (response.state === 0 && response.result) {
        return {
          success: true,
          wallet: response.result,
        };
      } else {
        throw new Error(response.message || "Wallet creation failed");
      }
    } catch (error) {
      console.error("Cryptomus wallet creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get balance
  static async getCryptomusBalance(): Promise<{
    success: boolean;
    balance?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.getBalance();

      if (response.state === 0 && response.result) {
        return {
          success: true,
          balance: response.result,
        };
      } else {
        throw new Error(response.message || "Failed to get balance");
      }
    } catch (error) {
      console.error("Failed to get Cryptomus balance:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Iyzico Checkout Form Integration (Hosted Payment Page)
  static async createIyzicoCheckout(data: IyzicoCheckoutData): Promise<{
    success: boolean;
    paymentUrl?: string;
    token?: string;
    checkoutFormContent?: string;
    error?: string;
  }> {
    try {
      const apiKey = process.env.IYZICO_API_KEY;
      const secretKey = process.env.IYZICO_SECRET_KEY;
      const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

      if (!apiKey || !secretKey) {
        return {
          success: false,
          error: "iyzico payment credentials are not configured",
        };
      }

      const Iyzipay = await getIyzico();
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: baseUrl,
      });

      // Convert amount to string with proper formatting
      const totalAmount = data.amount.toFixed(2);
      const paidPrice = data.amount.toFixed(2);

      const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: data.orderId,
        price: totalAmount,
        paidPrice: paidPrice,
        currency: data.currency === "USD" ? Iyzipay.CURRENCY.USD : Iyzipay.CURRENCY.TRY,
        basketId: `B${data.orderId}`,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: data.callbackUrl || `${appUrl}/api/payment/iyzico/callback`,
        enabledInstallments: [1],
        buyer: {
          id: data.buyer.id,
          name: data.buyer.name,
          surname: data.buyer.surname,
          gsmNumber: data.buyer.gsmNumber,
          email: data.buyer.email,
          identityNumber: data.buyer.identityNumber,
          lastLoginDate: new Date().toISOString().replace("T", " ").slice(0, 19),
          registrationDate: new Date().toISOString().replace("T", " ").slice(0, 19),
          registrationAddress: data.buyer.registrationAddress,
          ip: data.buyer.ip,
          city: data.buyer.city,
          country: data.buyer.country,
          zipCode: data.buyer.zipCode,
        },
        shippingAddress: data.billingAddress,
        billingAddress: data.billingAddress,
        basketItems: data.basketItems.map((item) => ({
          id: item.id,
          name: item.name,
          category1: item.category1,
          category2: item.category2 || "",
          itemType: item.itemType === "PHYSICAL" ? Iyzipay.BASKET_ITEM_TYPE.PHYSICAL : Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: item.price,
        })),
      };

      return new Promise((resolve) => {
        // @ts-expect-error - iyzico types may not include checkoutFormInitialize
        iyzipay.checkoutFormInitialize.create(request, (err: IyzicoError | null, result: IyzicoCheckoutResult) => {
          if (err) {
            console.error("Iyzico checkout form creation failed:", err);
            resolve({
              success: false,
              error: err.message || "Checkout form creation failed",
            });
            return;
          }

          if (result.status === "success") {
            resolve({
              success: true,
              paymentUrl: result.paymentPageUrl,
              token: result.token,
              checkoutFormContent: result.checkoutFormContent,
            });
          } else {
            resolve({
              success: false,
              error: result.errorMessage || "Checkout form creation failed",
            });
          }
        });
      });
    } catch (error) {
      console.error("Iyzico checkout form creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Utility methods for Iyzico payment management (used by admin features)
  
  // Get iyzico payment information
  static async getIyzicoPaymentInfo(
    paymentId: string,
    conversationId?: string,
  ): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
  }> {
    try {
      const apiKey = process.env.IYZICO_API_KEY;
      const secretKey = process.env.IYZICO_SECRET_KEY;
      const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

      if (!apiKey || !secretKey) {
        return {
          success: false,
          error: "iyzico payment credentials are not configured",
        };
      }

      const Iyzipay = await getIyzico();
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: baseUrl,
      });

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || paymentId,
        paymentId: paymentId,
      };

      return new Promise((resolve) => {
        iyzipay.payment.retrieve(request, (err: IyzicoError | null, result: IyzicoCheckoutResult) => {
          if (err) {
            console.error("Failed to get iyzico payment info:", err);
            resolve({
              success: false,
              error: err.message || "Failed to get payment info",
            });
            return;
          }

          if (result.status === "success") {
            resolve({
              success: true,
              payment: result,
            });
          } else {
            resolve({
              success: false,
              error: result.errorMessage || "Failed to get payment info",
            });
          }
        });
      });
    } catch (error) {
      console.error("Failed to get iyzico payment info:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Refund iyzico payment
  static async refundIyzicoPayment(
    paymentTransactionId: string,
    price: number,
    currency: string = "TRY",
    conversationId?: string,
  ): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      const apiKey = process.env.IYZICO_API_KEY;
      const secretKey = process.env.IYZICO_SECRET_KEY;
      const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

      if (!apiKey || !secretKey) {
        return {
          success: false,
          error: "iyzico payment credentials are not configured",
        };
      }

      const Iyzipay = await getIyzico();
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: baseUrl,
      });

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || paymentTransactionId,
        paymentTransactionId: paymentTransactionId,
        price: price.toFixed(2),
        currency: currency === "USD" ? Iyzipay.CURRENCY.USD : Iyzipay.CURRENCY.TRY,
        ip: "127.0.0.1", // This should be the merchant's IP
      };

      return new Promise((resolve) => {
        iyzipay.refund.create(request, (err: IyzicoError | null, result: IyzicoRefundResult) => {
          if (err) {
            console.error("Iyzico refund failed:", err);
            resolve({
              success: false,
              error: err.message || "Refund failed",
            });
            return;
          }

          if (result.status === "success") {
            resolve({
              success: true,
              refundId: result.paymentId,
            });
          } else {
            resolve({
              success: false,
              error: result.errorMessage || "Refund failed",
            });
          }
        });
      });
    } catch (error) {
      console.error("Iyzico refund failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
