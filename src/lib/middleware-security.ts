import { NextRequest, NextResponse } from "next/server";
import { securityMonitor } from "./security-monitor";

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

    // Check for rate limiting (simple in-memory tracking)
    const rateLimitKey = `${ip}:${pathname}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100; // Max requests per window

    if (!this.requestCounts) {
      this.requestCounts = new Map();
    }

    const requestData = this.requestCounts.get(rateLimitKey) || { count: 0, windowStart: now };
    
    // Reset window if expired
    if (now - requestData.windowStart > windowMs) {
      requestData.count = 0;
      requestData.windowStart = now;
    }

    requestData.count++;
    this.requestCounts.set(rateLimitKey, requestData);

    // Check if rate limit exceeded (exclude only signin/signup to prevent duplication with brute force detection)
    if (requestData.count > maxRequests && !pathname.includes("/signin") && !pathname.includes("/signup")) {
      await securityMonitor.analyzeEvent({
        type: "RATE_LIMIT_EXCEEDED",
        severity: "HIGH",
        source: "Middleware - Rate Limiting",
        ip,
        userAgent,
        details: {
          pathname,
          method,
          requestCount: requestData.count,
          windowMs,
          maxRequests
        }
      });
    }

    // Check for abnormal traffic patterns
    const totalRequestsFromIP = Array.from(this.requestCounts.entries())
      .filter(([key]) => key.startsWith(`${ip}:`))
      .reduce((sum, [, data]) => sum + data.count, 0);

    if (totalRequestsFromIP > 500) { // Abnormal traffic threshold - keep this for all paths
      await securityMonitor.analyzeEvent({
        type: "ABNORMAL_TRAFFIC",
        severity: "HIGH",
        source: "Middleware - Traffic Analysis",
        ip,
        userAgent,
        details: {
          totalRequests: totalRequestsFromIP,
          timeWindow: windowMs,
          detectionType: "high_volume_requests"
        }
      });
    }

    // Detect suspicious patterns
    const threats = this.detectSuspiciousPatterns(request);
    
    // Calculate risk score
    const riskScore = this.calculateRequestRiskScore(request, threats);

    // Log high-risk requests with appropriate event type (avoid only signin/signup for brute force, keep others)
    if (riskScore > 70 && !pathname.includes("/signin") && !pathname.includes("/signup")) {
      let eventType: "MALICIOUS_PAYLOAD" | "INJECTION_ATTEMPT" | "SUSPICIOUS_FILE_ACCESS" | "POTENTIAL_BOT" | "UNAUTHORIZED_ACCESS" = "UNAUTHORIZED_ACCESS";
      
      if (threats.includes("MALICIOUS_PAYLOAD")) {
        eventType = "MALICIOUS_PAYLOAD";
      } else if (threats.includes("SQL_INJECTION") || threats.includes("XSS_ATTEMPT")) {
        eventType = "INJECTION_ATTEMPT";
      } else if (threats.includes("PATH_TRAVERSAL")) {
        eventType = "SUSPICIOUS_FILE_ACCESS";
      } else if (threats.includes("POTENTIAL_BOT")) {
        eventType = "POTENTIAL_BOT";
      } else if (threats.includes("POTENTIAL_CSRF")) {
        eventType = "UNAUTHORIZED_ACCESS";
      }
        
      await securityMonitor.analyzeEvent({
        type: eventType,
        severity: riskScore > 90 ? "CRITICAL" : "HIGH",
        source: `Middleware - ${pathname}`,
        ip,
        userAgent,
        details: {
          path: pathname,
          method,
          threats,
          riskScore,
          detectionType: "high_risk_request"
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
    
    // For development/testing - use a more realistic IP for testing
    const devIP = process.env.NODE_ENV === "development" ? "192.168.1.100" : "127.0.0.1";
    return devIP;
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

    // Malicious payload detection in request body (for POST requests)
    if (request.method === "POST" || request.method === "PUT") {
      const maliciousPatterns = [
        /eval\s*\(/i,
        /exec\s*\(/i,
        /system\s*\(/i,
        /shell_exec/i,
        /base64_decode/i,
        /file_get_contents/i
      ];

      // Check URL for malicious patterns (since we can't easily access body in middleware)
      maliciousPatterns.forEach(pattern => {
        if (pattern.test(url)) {
          threats.push("MALICIOUS_PAYLOAD");
        }
      });
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
        case "MALICIOUS_PAYLOAD":
          score += 50;
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

  private requestCounts: Map<string, { count: number; windowStart: number }> | undefined;
}

// Export singleton instance
export const middlewareSecurity = new MiddlewareSecurity();

// Export types
export type { RequestAnalysis }; 

