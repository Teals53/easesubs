import crypto from "crypto";
import { Cryptomus } from "./cryptomus";

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateCryptomusWebhook(
  payload: string,
  signature: string,
  secret: string,
): WebhookValidationResult {
  try {
    // Use the Cryptomus SDK's webhook validation method
    const isValid = Cryptomus.validateWebhook(payload, signature, secret);
    return { isValid };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Invalid signature format",
    };
  }
}

export function validateStripeWebhook(
  payload: string,
  signature: string,
  secret: string,
): WebhookValidationResult {
  try {
    const elements = signature.split(",");
    const signatureElements = elements.reduce(
      (acc, element) => {
        const [key, value] = element.split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    if (!signatureElements.t || !signatureElements.v1) {
      return { isValid: false, error: "Missing timestamp or signature" };
    }

    const timestamp = signatureElements.t;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signatureElements.v1),
      Buffer.from(expectedSignature),
    );

    // Check timestamp tolerance (5 minutes)
    const timestampTolerance = 5 * 60 * 1000;
    const webhookTimestamp = parseInt(timestamp) * 1000;
    const currentTime = Date.now();

    if (Math.abs(currentTime - webhookTimestamp) > timestampTolerance) {
      return { isValid: false, error: "Timestamp outside tolerance" };
    }

    return { isValid };
  } catch {
    return { isValid: false, error: "Invalid signature format" };
  }
}
