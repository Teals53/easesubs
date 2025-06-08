import { NextRequest, NextResponse } from "next/server";
import { securityMonitor } from "./security-monitor";
import { secureLogger } from "./secure-logger";

interface RequestAnalysis {
  ip: string;
  userAgent: string;
  pathname: string;
  method: string;
  isBlocked: boolean;
  riskScore: number;
  threats: string[];
}

/**
 * Security middleware integration for request analysis
 */
export class MiddlewareSecurity {
  /**
   * Analyze incoming request for security threats
   */
  async analyzeRequest(request: NextRequest): Promise<RequestAnalysis> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // Check if IP is blocked
    const isBlocked = await securityMonitor.isIPBlocked(ip);
    if (isBlocked) {
      secureLogger.security("Blocked IP attempted access", { ip, pathname, method });
      return {
        ip,
        userAgent,
        pathname,
        method,
        isBlocked: true,
        riskScore: 100,
        threats: ["BLOCKED_IP"]
      };
    }

    // Detect suspicious patterns
    const threats = this.detectSuspiciousPatterns(request);
    
    // Calculate risk score
    const riskScore = this.calculateRequestRiskScore(request, threats);

    // Log high-risk requests
    if (riskScore > 70) {
      await securityMonitor.analyzeEvent({
        type: "SUSPICIOUS_LOGIN",
        severity: riskScore > 90 ? "CRITICAL" : "HIGH",
        source: `Middleware - ${pathname}`,
        ip,
        userAgent,
        details: {
          path: pathname,
          method,
          threats,
          riskScore
        }
      });
    }

    return {
      ip,
      userAgent,
      pathname,
      method,
      isBlocked: false,
      riskScore,
      threats
    };
  }

  /**
   * Get client IP from request headers
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cloudflareIP = request.headers.get("cf-connecting-ip");
    
    if (cloudflareIP) return cloudflareIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(",")[0]?.trim() || "";
    
    // For development/testing
    return "127.0.0.1";
  }

  /**
   * Detect suspicious patterns in request
   */
  private detectSuspiciousPatterns(request: NextRequest): string[] {
    const threats: string[] = [];
    const url = request.nextUrl.toString();
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";

    // SQL Injection patterns
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/i,
      /(drop|create|alter|insert|delete|update)\s+(table|database|schema)/i,
      /(\bor\b|\band\b)\s*\d+\s*=\s*\d+/i,
      /['";]\s*(or|and)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/i
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        threats.push("SQL_INJECTION");
      }
    });

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=\s*["'][^"']*["']/i,
      /<iframe[^>]*>.*?<\/iframe>/i
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        threats.push("XSS_ATTEMPT");
      }
    });

    // Path traversal
    if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\/.test(url)) {
      threats.push("PATH_TRAVERSAL");
    }

    // Bot detection
    const botPatterns = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|php/i,
      /automated|headless/i
    ];

    botPatterns.forEach(pattern => {
      if (pattern.test(userAgent)) {
        threats.push("POTENTIAL_BOT");
      }
    });

    // Suspicious user agents
    if (!userAgent || userAgent.length < 10) {
      threats.push("SUSPICIOUS_USER_AGENT");
    }

    // CSRF patterns (missing referer on sensitive endpoints)
    const sensitiveEndpoints = ["/api/auth", "/api/payment", "/api/admin"];
    if (sensitiveEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
      if (!referer && request.method === "POST") {
        threats.push("POTENTIAL_CSRF");
      }
    }

    return threats;
  }

  /**
   * Calculate risk score for request
   */
  private calculateRequestRiskScore(request: NextRequest, threats: string[]): number {
    let score = 0;

    // Base threat scoring
    threats.forEach(threat => {
      switch (threat) {
        case "SQL_INJECTION":
        case "XSS_ATTEMPT":
          score += 40;
          break;
        case "PATH_TRAVERSAL":
          score += 35;
          break;
        case "POTENTIAL_BOT":
          score += 20;
          break;
        case "SUSPICIOUS_USER_AGENT":
          score += 15;
          break;
        case "POTENTIAL_CSRF":
          score += 25;
          break;
        default:
          score += 10;
      }
    });

    // Method-based scoring
    if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {
      score += 5;
    }

    // Sensitive endpoint scoring
    const sensitivePaths = ["/api/auth", "/api/payment", "/api/admin", "/dashboard/admin"];
    if (sensitivePaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      score += 10;
    }

    // Multiple threats multiplier
    if (threats.length > 2) {
      score = Math.floor(score * 1.5);
    }

    return Math.min(score, 100);
  }

  /**
   * Handle blocked request
   */
  handleBlockedRequest(analysis: RequestAnalysis): NextResponse {
    secureLogger.security("Request blocked by security middleware", {
      ip: analysis.ip,
      pathname: analysis.pathname,
      method: analysis.method,
      riskScore: analysis.riskScore,
      threats: analysis.threats
    });

    // Return appropriate response based on threat type
    if (analysis.threats.includes("BLOCKED_IP")) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    if (analysis.threats.includes("RATE_LIMIT_EXCEEDED")) {
      return new NextResponse("Too Many Requests", { 
        status: 429,
        headers: {
          "Retry-After": "60"
        }
      });
    }

    return new NextResponse("Security Check Failed", { status: 400 });
  }
}

// Export singleton instance
export const middlewareSecurity = new MiddlewareSecurity();

// Export types
export type { RequestAnalysis }; 