/**
 * Secure logging utility that prevents sensitive information leakage in production
 */

interface LogContext {
  userId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

interface SensitiveData {
  email?: string;
  password?: string;
  token?: string;
  sessionId?: string;
  paymentDetails?: Record<string, unknown>;
  apiKey?: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Sanitize sensitive data for logging
   */
  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...(data as Record<string, unknown>) };
    const sensitiveKeys = [
      'password', 'token', 'apiKey', 'sessionId', 'secret', 'key',
      'authorization', 'cookie', 'signature', 'hash', 'salt'
    ];

    // Recursively sanitize object
    for (const [key, value] of Object.entries(sanitized)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (key === 'email' && typeof value === 'string') {
        // Partially mask email addresses
        sanitized[key] = this.maskEmail(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  /**
   * Mask email address for logging
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '[INVALID_EMAIL]';
    
    const [username, domain] = email.split('@');
    if (!username || !domain) return '[INVALID_EMAIL]';
    
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : '*'.repeat(username.length);
    
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Create log entry with context
   */
  private createLogEntry(level: string, message: string, data?: unknown, context?: LogContext) {
    const baseEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
    };

    const contextEntry = context ? {
      context: {
        ...context,
        timestamp: context.timestamp?.toISOString() || new Date().toISOString(),
        userId: context.userId ? this.maskId(context.userId) : undefined,
        ip: context.ip ? this.maskIp(context.ip) : undefined,
      }
    } : {};

    const dataEntry = data ? { data: this.sanitizeData(data) } : {};

    return { ...baseEntry, ...contextEntry, ...dataEntry };
  }

  /**
   * Mask user ID for logging
   */
  private maskId(id: string): string {
    if (id.length <= 8) return id;
    return id.substring(0, 4) + '*'.repeat(4) + id.substring(id.length - 4);
  }

  /**
   * Mask IP address for logging
   */
  private maskIp(ip: string): string {
    if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':');
      return parts.slice(0, 2).join(':') + ':****';
    } else {
      // IPv4
      const parts = ip.split('.');
      return parts.slice(0, 2).join('.') + '.***.**';
    }
  }

  /**
   * Log info level messages
   */
  info(message: string, data?: unknown, context?: LogContext) {
    if (this.isProduction && !process.env.ENABLE_PRODUCTION_LOGS) {
      return; // Skip logging in production unless explicitly enabled
    }

    const entry = this.createLogEntry('info', message, data, context);
    
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data ? this.sanitizeData(data) : '');
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log warning level messages
   */
  warn(message: string, data?: unknown, context?: LogContext) {
    const entry = this.createLogEntry('warn', message, data, context);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data ? this.sanitizeData(data) : '');
    } else {
      console.warn(JSON.stringify(entry));
    }
  }

  /**
   * Log error level messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: this.isDevelopment ? error.stack : '[REDACTED]' }
      : error;

    const entry = this.createLogEntry('error', message, errorData, context);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(JSON.stringify(entry));
    }
  }

  /**
   * Log debug level messages (development only)
   */
  debug(message: string, data?: unknown) {
    if (!this.isDevelopment) return;

    console.log(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
  }

  /**
   * Log security events (always logged)
   */
  security(message: string, data?: unknown, context?: LogContext) {
    const entry = this.createLogEntry('security', message, data, context);
    
    // Security events are always logged
    console.warn(`[SECURITY] ${message}`, this.sanitizeData(data || {}));
    
    // In production, also write to structured log
    if (this.isProduction) {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log authentication events
   */
  auth(message: string, email?: string, context?: LogContext) {
    const authContext = {
      ...context,
      email: email ? this.maskEmail(email) : undefined
    };

    this.security(`AUTH: ${message}`, undefined, authContext);
  }

  /**
   * Log payment events
   */
  payment(message: string, paymentData?: Record<string, unknown>, context?: LogContext) {
    const sanitizedPayment = paymentData ? {
      ...paymentData,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      // Remove sensitive payment details
      paymentMethod: '[REDACTED]',
      cardDetails: '[REDACTED]',
      accountDetails: '[REDACTED]'
    } : undefined;

    this.info(`PAYMENT: ${message}`, sanitizedPayment, context);
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// Export types for use in other files
export type { LogContext, SensitiveData }; 