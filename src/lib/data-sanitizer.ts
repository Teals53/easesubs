/**
 * Data Sanitization for API Responses
 * Prevents sensitive information exposure in API responses
 */

interface SanitizationConfig {
  // Fields to completely remove
  excludeFields: string[];
  // Fields to mask (show partial data)
  maskFields: string[];
  // Fields to hash (for comparison purposes)
  hashFields: string[];
  // Custom sanitization functions
  customSanitizers?: Record<string, (value: unknown) => unknown>;
}

// Default configuration for user data
const USER_SANITIZATION_CONFIG: SanitizationConfig = {
  excludeFields: [
    "password",
    "passwordHash",
    "resetToken",
    "verificationToken",
    "twoFactorSecret",
    "backupCodes",
    "sessions",
    "loginAttempts",
  ],
  maskFields: ["email", "phone", "ssn", "creditCard", "bankAccount"],
  hashFields: [
    "hashedEmail", // For comparison without exposure
  ],
  customSanitizers: {
    email: (value: unknown) => {
      if (typeof value === "string" && value.includes("@")) {
        const [username, domain] = value.split("@");
        if (username && domain) {
          const maskedUsername =
            username.length > 2
              ? username.substring(0, 2) + "*".repeat(username.length - 2)
              : "*".repeat(username.length);
          return `${maskedUsername}@${domain}`;
        }
      }
      return "[MASKED_EMAIL]";
    },
  },
};

// Configuration for payment data
const PAYMENT_SANITIZATION_CONFIG: SanitizationConfig = {
  excludeFields: [
    "cardNumber",
    "cvv",
    "securityCode",
    "bankAccountNumber",
    "routingNumber",
    "paymentMethodToken",
    "billingAddress",
    "webhookData",
  ],
  maskFields: ["lastFourDigits", "expiryDate"],
  hashFields: [],
};

// Configuration for order data
const ORDER_SANITIZATION_CONFIG: SanitizationConfig = {
  excludeFields: [
    "paymentDetails",
    "shippingAddress",
    "billingAddress",
    "internalNotes",
  ],
  maskFields: ["customerEmail", "customerPhone"],
  hashFields: [],
};

class DataSanitizer {
  /**
   * Sanitize user data for API responses
   */
  sanitizeUser(
    userData: Record<string, unknown>,
    isOwner = false,
  ): Record<string, unknown> {
    if (isOwner) {
      // Owner can see more fields but still sanitized
      const config = {
        ...USER_SANITIZATION_CONFIG,
        excludeFields: [
          "password",
          "passwordHash",
          "resetToken",
          "verificationToken",
        ],
      };
      return this.sanitizeData(userData, config);
    }

    return this.sanitizeData(userData, USER_SANITIZATION_CONFIG);
  }

  /**
   * Sanitize payment data
   */
  sanitizePayment(
    paymentData: Record<string, unknown>,
  ): Record<string, unknown> {
    return this.sanitizeData(paymentData, PAYMENT_SANITIZATION_CONFIG);
  }

  /**
   * Sanitize order data
   */
  sanitizeOrder(
    orderData: Record<string, unknown>,
    isOwner = false,
  ): Record<string, unknown> {
    const config = isOwner
      ? { ...ORDER_SANITIZATION_CONFIG, excludeFields: ["internalNotes"] }
      : ORDER_SANITIZATION_CONFIG;

    return this.sanitizeData(orderData, config);
  }

  /**
   * Sanitize admin data (for admin users only)
   */
  sanitizeAdminData(data: Record<string, unknown>): Record<string, unknown> {
    // Admin can see more but still protect critical secrets
    const adminConfig: SanitizationConfig = {
      excludeFields: ["password", "passwordHash", "resetToken"],
      maskFields: [],
      hashFields: [],
    };

    return this.sanitizeData(data, adminConfig);
  }

  /**
   * Core sanitization function
   */
  private sanitizeData(
    data: Record<string, unknown>,
    config: SanitizationConfig,
  ): Record<string, unknown> {
    if (!data || typeof data !== "object") {
      return {};
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Exclude sensitive fields completely
      if (
        config.excludeFields.some((field) =>
          lowerKey.includes(field.toLowerCase()),
        )
      ) {
        continue;
      }

      // Apply custom sanitization
      if (config.customSanitizers && config.customSanitizers[key]) {
        sanitized[key] = config.customSanitizers[key](value);
        continue;
      }

      // Mask sensitive fields
      if (
        config.maskFields.some((field) =>
          lowerKey.includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = this.maskValue(value);
        continue;
      }

      // Hash fields that need to be compared but not exposed
      if (
        config.hashFields.some((field) =>
          lowerKey.includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = this.hashValue(value);
        continue;
      }

      // Recursively sanitize nested objects
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          sanitized[key] = value.map((item) =>
            typeof item === "object" && item !== null
              ? this.sanitizeData(item as Record<string, unknown>, config)
              : item,
          );
        } else {
          sanitized[key] = this.sanitizeData(
            value as Record<string, unknown>,
            config,
          );
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Mask sensitive values
   */
  private maskValue(value: unknown): string {
    if (typeof value === "string") {
      if (value.length <= 4) {
        return "*".repeat(value.length);
      }
      return (
        value.substring(0, 2) +
        "*".repeat(value.length - 4) +
        value.substring(value.length - 2)
      );
    }
    return "[MASKED]";
  }

  /**
   * Hash values for comparison without exposure
   */
  private hashValue(value: unknown): string {
    if (typeof value === "string") {
      // Simple hash for comparison (use crypto.hash in production)
      return `hash_${value.length}_${value.charCodeAt(0)}`;
    }
    return "[HASHED]";
  }

  /**
   * Remove metadata that could leak information
   */
  removeMetadata(data: Record<string, unknown>): Record<string, unknown> {
    const metadataFields = [
      "createdBy",
      "updatedBy",
      "deletedBy",
      "internalId",
      "systemNotes",
      "debugInfo",
      "traceId",
      "sessionId",
    ];

    const cleaned = { ...data };

    metadataFields.forEach((field) => {
      delete cleaned[field];
    });

    return cleaned;
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  sanitizeError(error: Error | unknown): { message: string; code?: string } {
    if (error instanceof Error) {
      // Don't expose internal paths, database errors, or system details
      let message = error.message;

      // Remove file paths
      message = message.replace(/\/[^\s]+/g, "[PATH_REMOVED]");

      // Remove database-specific errors
      if (message.includes("Prisma") || message.includes("database")) {
        message = "Database operation failed";
      }

      // Remove internal server details
      if (message.includes("ECONNREFUSED") || message.includes("timeout")) {
        message = "Service temporarily unavailable";
      }

      return {
        message: message.substring(0, 200), // Limit message length
        code: "SANITIZED_ERROR",
      };
    }

    return {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    };
  }

  /**
   * Validate data doesn't contain sensitive patterns before sending
   */
  validateNoSensitiveData(data: unknown): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /hash/i,
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card patterns
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN patterns
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email patterns (if supposed to be masked)
    ];

    const dataString = JSON.stringify(data).toLowerCase();

    sensitivePatterns.forEach((pattern, index) => {
      if (pattern.test(dataString)) {
        violations.push(`Sensitive pattern ${index + 1} detected`);
      }
    });

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}

// Export singleton instance
export const dataSanitizer = new DataSanitizer();

// Export types
export type { SanitizationConfig };
