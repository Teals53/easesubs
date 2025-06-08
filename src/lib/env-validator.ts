/**
 * Environment Variable Security Validator
 * Ensures all required secrets are properly configured and not using default/example values
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  criticalIssues: string[];
}

class EnvironmentValidator {
  private requiredSecrets = [
    'AUTH_SECRET',
    'DATABASE_URL',
    'CRYPTOMUS_PAYMENT_API_KEY',
    'CRYPTOMUS_SECRET',
    'SMTP_PASSWORD'
  ];

  private requiredEnvVars = [
    'NEXTAUTH_URL',
    'CRYPTOMUS_MERCHANT_ID',
    'SMTP_HOST',
    'SMTP_USER'
  ];

  private dangerousDefaults = [
    'your-super-secret-auth-key-here',
    'your-google-client-id',
    'your-cryptomus-merchant-id',
    'your-email@gmail.com',
    'password',
    'localhost',
    'example.com'
  ];

  private weakSecrets = [
    'secret',
    '123456',
    'password',
    'admin',
    'test',
    'dev',
    'changeme'
  ];

  /**
   * Validate all environment variables for security issues
   */
  validate(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];

    // Check for missing required secrets
    for (const secret of this.requiredSecrets) {
      if (!process.env[secret]) {
        criticalIssues.push(`Missing required secret: ${secret}`);
      } else if (this.isWeakSecret(process.env[secret]!)) {
        criticalIssues.push(`Weak secret detected for: ${secret}`);
      } else if (this.isDangerousDefault(process.env[secret]!)) {
        criticalIssues.push(`Default/example value found for: ${secret}`);
      }
    }

    // Check for missing required environment variables
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      } else if (this.isDangerousDefault(process.env[envVar]!)) {
        warnings.push(`Example value detected for: ${envVar}`);
      }
    }

    // Database security checks
    this.validateDatabase(errors, warnings, criticalIssues);

    // Auth secret strength validation
    this.validateAuthSecret(errors, warnings, criticalIssues);

    // Production-specific validations
    if (process.env.NODE_ENV === 'production') {
      this.validateProduction(errors, warnings, criticalIssues);
    }

    return {
      isValid: criticalIssues.length === 0 && errors.length === 0,
      errors,
      warnings,
      criticalIssues
    };
  }

  /**
   * Check if a value is a dangerous default
   */
  private isDangerousDefault(value: string): boolean {
    const lowerValue = value.toLowerCase();
    return this.dangerousDefaults.some(dangerous => 
      lowerValue.includes(dangerous.toLowerCase())
    );
  }

  /**
   * Check if a secret is weak
   */
  private isWeakSecret(secret: string): boolean {
    if (secret.length < 32) return true;
    
    const lowerSecret = secret.toLowerCase();
    return this.weakSecrets.some(weak => lowerSecret.includes(weak));
  }

  /**
   * Validate database configuration
   */
  private validateDatabase(errors: string[], warnings: string[], criticalIssues: string[]) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Check for insecure database connections
      if (dbUrl.includes('password') && !dbUrl.includes('ssl=true')) {
        warnings.push('Database connection should use SSL in production');
      }
      
      // Check for weak database passwords
      const passwordMatch = dbUrl.match(/:([^@]+)@/);
      if (passwordMatch && passwordMatch[1]) {
        const password = passwordMatch[1];
        if (this.isWeakSecret(password)) {
          criticalIssues.push('Database password is too weak');
        }
        if (password.includes('password') || password.includes('123')) {
          criticalIssues.push('Database password contains common patterns');
        }
      }

      // Check for localhost in production
      if (process.env.NODE_ENV === 'production' && dbUrl.includes('localhost')) {
        errors.push('Production database should not use localhost');
      }
    }
  }

  /**
   * Validate AUTH_SECRET strength
   */
  private validateAuthSecret(errors: string[], warnings: string[], criticalIssues: string[]) {
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret) {
      if (authSecret.length < 32) {
        criticalIssues.push('AUTH_SECRET must be at least 32 characters long');
      }
      
      // Check entropy (basic check)
      const uniqueChars = new Set(authSecret).size;
      if (uniqueChars < 16) {
        warnings.push('AUTH_SECRET has low entropy (few unique characters)');
      }

      // Check for patterns
      if (/(.)\1{3,}/.test(authSecret)) {
        warnings.push('AUTH_SECRET contains repeated character patterns');
      }
    }
  }

  /**
   * Production-specific validations
   */
  private validateProduction(errors: string[], warnings: string[], criticalIssues: string[]) {
    // Check NEXTAUTH_URL
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl) {
      if (!nextAuthUrl.startsWith('https://')) {
        criticalIssues.push('NEXTAUTH_URL must use HTTPS in production');
      }
      if (nextAuthUrl.includes('localhost') || nextAuthUrl.includes('127.0.0.1')) {
        errors.push('Production NEXTAUTH_URL should not use localhost');
      }
    }

    // Check CORS origin
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && corsOrigin.includes('localhost')) {
      warnings.push('CORS_ORIGIN should not include localhost in production');
    }

    // Check debug flags
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      warnings.push('Debug mode is enabled in production');
    }

    // Check if OAuth secrets are configured
    if (!process.env.GOOGLE_CLIENT_SECRET && !process.env.GITHUB_CLIENT_SECRET) {
      warnings.push('No OAuth providers configured - users can only use email/password');
    }
  }

  /**
   * Get secure environment summary (for logging)
   */
  getSecureEnvSummary() {
    return {
      nodeEnv: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      hasPaymentConfig: !!(process.env.CRYPTOMUS_MERCHANT_ID && process.env.CRYPTOMUS_PAYMENT_API_KEY),
      hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      hasGitHubOAuth: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      isProduction: process.env.NODE_ENV === 'production',
      authUrlSecure: process.env.NEXTAUTH_URL?.startsWith('https://') || false
    };
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Export types
export type { EnvValidationResult };

/**
 * Validate environment on module load in production
 */
if (process.env.NODE_ENV === 'production') {
  const validation = envValidator.validate();
  
  if (!validation.isValid) {
    console.error('🚨 CRITICAL ENVIRONMENT SECURITY ISSUES:');
    validation.criticalIssues.forEach(issue => console.error(`❌ ${issue}`));
    validation.errors.forEach(error => console.error(`⚠️ ${error}`));
    
    if (validation.criticalIssues.length > 0) {
      console.error('🛑 Application startup blocked due to critical security issues');
      process.exit(1);
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ ENVIRONMENT WARNINGS:');
    validation.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  }
} 