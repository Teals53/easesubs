import { db } from "@/lib/db";
import { secureLogger } from "@/lib/secure-logger";
import type { Prisma } from "@prisma/client";

// Types for security monitoring
interface SecurityEvent {
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  details: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

type SecurityEventType =
  | 'BRUTE_FORCE_ATTEMPT'
  | 'SUSPICIOUS_LOGIN'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_EXFILTRATION'
  | 'INJECTION_ATTEMPT'
  | 'MALICIOUS_PAYLOAD'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'SUSPICIOUS_FILE_ACCESS'
  | 'ABNORMAL_TRAFFIC'
  | 'POTENTIAL_BOT'
  | 'ADMIN_ACTION';

interface ThreatDetectionRule {
  name: string;
  pattern: RegExp | string;
  severity: SecurityEvent['severity'];
  action: 'LOG' | 'BLOCK' | 'ALERT' | 'QUARANTINE';
  threshold?: number;
  timeWindow?: number; // in minutes
}

interface SecurityStats {
  totalEvents: number;
  last24Hours: number;
  severityDistribution: Record<string, number>;
  topThreats: Array<{ type: string; count: number }>;
}

/**
 * Production-ready Security Monitor with Prisma ORM
 */
class SecurityMonitor {
  // In-memory cache for blocked IPs (for performance)
  private blockedIPCache = new Map<string, boolean>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  // Threat detection rules
  private threatRules: ThreatDetectionRule[] = [
    {
      name: 'SQL Injection Attempt',
      pattern: /(union|select|insert|delete|update|drop|exec|script|javascript:|eval\(|alert\()/i,
      severity: 'HIGH',
      action: 'BLOCK'
    },
    {
      name: 'XSS Attempt',
      pattern: /<script|javascript:|on\w+\s*=/i,
      severity: 'HIGH',
      action: 'BLOCK'
    },
    {
      name: 'Path Traversal',
      pattern: /\.\.[\/\\]|[\/\\]\.\./,
      severity: 'MEDIUM',
      action: 'BLOCK'
    },
    {
      name: 'Suspicious User Agent',
      pattern: /(curl|wget|python|bot|scanner|crawl)/i,
      severity: 'MEDIUM',
      action: 'LOG'
    }
  ];

  /**
   * Analyze and store a security event in database
   */
  async analyzeEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const fullEvent = {
        ...event,
        timestamp: new Date()
      };

      // Store event in database using Prisma
      await db.securityEvent.create({
        data: {
          type: fullEvent.type,
          severity: fullEvent.severity,
          source: fullEvent.source,
          ip: fullEvent.ip,
          userAgent: fullEvent.userAgent,
          userId: fullEvent.userId,
          details: fullEvent.details as Prisma.JsonObject,
          timestamp: fullEvent.timestamp
        }
      });

      // Analyze threats
      const threats = this.detectThreats(fullEvent);
      
      // Handle IP-based threats
      if (fullEvent.ip && threats.some(t => t.action === 'BLOCK')) {
        await this.handleIPThreat(fullEvent.ip, fullEvent.severity);
      }

      // Log based on severity
      if (fullEvent.severity === 'CRITICAL' || fullEvent.severity === 'HIGH') {
        secureLogger.security(`Security event: ${fullEvent.type}`, {
          severity: fullEvent.severity,
          source: fullEvent.source,
          ip: fullEvent.ip,
          threats: threats.length
        });
      }

    } catch (error) {
      secureLogger.error('Failed to analyze security event', error);
    }
  }

  /**
   * Check if an IP is blocked (with caching)
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    try {
      // Check cache first
      if (Date.now() - this.lastCacheUpdate < this.cacheExpiry) {
        if (this.blockedIPCache.has(ip)) {
          return this.blockedIPCache.get(ip)!;
        }
      }

      // Query database using Prisma
      const blockedIP = await db.blockedIP.findFirst({
        where: {
          ip,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      const isBlocked = !!blockedIP;
      this.blockedIPCache.set(ip, isBlocked);
      this.lastCacheUpdate = Date.now();
      
      return isBlocked;
    } catch (error) {
      secureLogger.error('Failed to check blocked IP', error);
      return false;
    }
  }

  /**
   * Block an IP address
   */
  async blockIP(ip: string, reason: string, durationMinutes?: number): Promise<void> {
    try {
      const expiresAt = durationMinutes 
        ? new Date(Date.now() + durationMinutes * 60 * 1000)
        : null;

      await db.blockedIP.upsert({
        where: { ip },
        update: {
          reason,
          isActive: true,
          expiresAt,
          updatedAt: new Date()
        },
        create: {
          ip,
          reason,
          score: 100,
          isActive: true,
          expiresAt
        }
      });

      // Update cache
      this.blockedIPCache.set(ip, true);
      
      secureLogger.security('IP blocked', { ip, reason, expiresAt });
    } catch (error) {
      secureLogger.error('Failed to block IP', error);
    }
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<void> {
    try {
      await db.blockedIP.updateMany({
        where: { ip },
        data: { isActive: false }
      });

      // Update cache
      this.blockedIPCache.set(ip, false);
      
      secureLogger.security('IP unblocked', { ip });
    } catch (error) {
      secureLogger.error('Failed to unblock IP', error);
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<SecurityStats> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get basic counts
      const [totalEvents, recentEvents] = await Promise.all([
        db.securityEvent.count(),
        db.securityEvent.count({
          where: { timestamp: { gte: last24Hours } }
        })
      ]);

      // Get severity distribution (last 24h)
      const severityData = await db.securityEvent.groupBy({
        by: ['severity'],
        where: { timestamp: { gte: last24Hours } },
        _count: { severity: true }
      });

      const severityDistribution = severityData.reduce((acc: Record<string, number>, item) => {
        acc[item.severity] = item._count.severity;
        return acc;
      }, {} as Record<string, number>);

      // Ensure all severities are represented
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].forEach(severity => {
        if (!severityDistribution[severity]) {
          severityDistribution[severity] = 0;
        }
      });

      // Get top threats (last 24h)
      const threatData = await db.securityEvent.groupBy({
        by: ['type'],
        where: { timestamp: { gte: last24Hours } },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        take: 5
      });

      const topThreats = threatData.map(item => ({
        type: item.type,
        count: item._count.type
      }));

      return {
        totalEvents,
        last24Hours: recentEvents,
        severityDistribution,
        topThreats
      };
    } catch (error) {
      secureLogger.error('Failed to get security stats', error);
      return {
        totalEvents: 0,
        last24Hours: 0,
        severityDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        topThreats: []
      };
    }
  }

  /**
   * Get recent security events
   */
  async getRecentEvents(limit = 50, severity?: string): Promise<Array<{
    id: string;
    type: string;
    severity: string;
    source: string;
    ip: string | null;
    userAgent: string | null;
    timestamp: Date;
    user: { id: string; email: string; name: string | null } | null;
    riskScore: number;
  }>> {
    try {
      const events = await db.securityEvent.findMany({
        where: severity ? { severity } : undefined,
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      return events.map(event => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        source: event.source,
        ip: event.ip,
        userAgent: event.userAgent,
        timestamp: event.timestamp,
        user: event.user,
        riskScore: this.calculateRiskScore(event.severity, event.type)
      }));
    } catch (error) {
      secureLogger.error('Failed to get recent events', error);
      return [];
    }
  }

  /**
   * Get blocked IPs with details
   */
  async getBlockedIPsWithDetails(): Promise<Array<{
    address: string;
    reason: string;
    score: number;
    blockedAt: Date;
    expiresAt: Date | null;
  }>> {
    try {
      const blockedIPs = await db.blockedIP.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { blockedAt: 'desc' }
      });

      return blockedIPs.map(ip => ({
        address: ip.ip,
        reason: ip.reason,
        score: ip.score,
        blockedAt: ip.blockedAt,
        expiresAt: ip.expiresAt
      }));
    } catch (error) {
      secureLogger.error('Failed to get blocked IPs', error);
      return [];
    }
  }

  /**
   * Clean up old security events (run periodically)
   */
  async cleanupOldEvents(daysToKeep = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await db.securityEvent.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      secureLogger.info(`Cleaned up ${deletedCount.count} old security events`);
    } catch (error) {
      secureLogger.error('Failed to cleanup old events', error);
    }
  }

  /**
   * Clean up expired blocked IPs
   */
  async cleanupExpiredBlocks(): Promise<void> {
    try {
      const now = new Date();
      
      const updatedCount = await db.blockedIP.updateMany({
        where: {
          isActive: true,
          expiresAt: { lt: now }
        },
        data: { isActive: false }
      });

      // Clear cache
      this.blockedIPCache.clear();
      this.lastCacheUpdate = 0;

      secureLogger.info(`Cleaned up ${updatedCount.count} expired IP blocks`);
    } catch (error) {
      secureLogger.error('Failed to cleanup expired blocks', error);
    }
  }

  // Private helper methods
  private detectThreats(event: SecurityEvent): Array<{ name: string; action: string; severity: string }> {
    const threats: Array<{ name: string; action: string; severity: string }> = [];
    const eventData = JSON.stringify(event.details).toLowerCase();

    for (const rule of this.threatRules) {
      if (typeof rule.pattern === 'string') {
        if (eventData.includes(rule.pattern.toLowerCase())) {
          threats.push({
            name: rule.name,
            action: rule.action,
            severity: rule.severity
          });
        }
      } else if (rule.pattern instanceof RegExp) {
        const match = rule.pattern.exec(eventData);
        if (match) {
          threats.push({
            name: rule.name,
            action: rule.action,
            severity: rule.severity
          });
        }
      }
    }

    return threats;
  }

  private async handleIPThreat(ip: string, severity: string): Promise<void> {
    // Calculate threat score
    const severityScores = { LOW: 10, MEDIUM: 25, HIGH: 50, CRITICAL: 100 };
    const baseScore = severityScores[severity as keyof typeof severityScores] || 10;
    
    // Get recent events from this IP (last hour)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = await db.securityEvent.count({
      where: {
        ip,
        timestamp: { gte: hourAgo }
      }
    });

    // Auto-block if score is high enough
    const totalScore = baseScore + (recentEvents * 5);
    if (totalScore >= 75) {
      await this.blockIP(ip, `Automatic block: threat score ${totalScore}`, 60); // 1 hour block
    }
  }

  private calculateRiskScore(severity: string, type: string): number {
    const severityScores = { LOW: 20, MEDIUM: 40, HIGH: 70, CRITICAL: 100 };
    const typeMultipliers: Record<string, number> = {
      'INJECTION_ATTEMPT': 1.5,
      'BRUTE_FORCE_ATTEMPT': 1.3,
      'PRIVILEGE_ESCALATION': 1.4,
      'MALICIOUS_PAYLOAD': 1.5
    };

    const baseScore = severityScores[severity as keyof typeof severityScores] || 20;
    const multiplier = typeMultipliers[type] || 1.0;
    
    return Math.min(Math.round(baseScore * multiplier), 100);
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Export types
export type { SecurityEvent, SecurityEventType, SecurityStats }; 