#!/usr/bin/env tsx

/**
 * Security Migration Script
 * 
 * This script helps migrate to the new database-backed security monitoring system
 * and performs maintenance tasks.
 */

import { PrismaClient } from "@prisma/client";
import { securityMonitor } from "../src/lib/security-monitor";

const db = new PrismaClient();

async function main() {
  console.log("🔒 Starting Security Migration Script...");

  try {
    // 1. Clean up old security events (older than 30 days)
    console.log("📊 Cleaning up old security events...");
    await securityMonitor.cleanupOldEvents(30);
    
    // 2. Clean up expired IP blocks
    console.log("🚫 Cleaning up expired IP blocks...");
    await securityMonitor.cleanupExpiredBlocks();
    
    // 3. Get current security stats
    console.log("📈 Getting current security statistics...");
    const stats = await securityMonitor.getSecurityStats();
    
    console.log("\n📊 Security Statistics:");
    console.log(`  Total Events: ${stats.totalEvents}`);
    console.log(`  Last 24 Hours: ${stats.last24Hours}`);
    console.log(`  Severity Distribution:`, stats.severityDistribution);
    console.log(`  Top Threats:`, stats.topThreats);
    
    // 4. Get blocked IPs
    const blockedIPs = await securityMonitor.getBlockedIPsWithDetails();
    console.log(`\n🚫 Blocked IPs: ${blockedIPs.length}`);
    
    if (blockedIPs.length > 0) {
      console.log("  Recent blocks:");
      blockedIPs.slice(0, 5).forEach((ip) => {
        console.log(`    ${ip.address} - ${ip.reason} (Score: ${ip.score})`);
      });
    }
    
    // 5. Test database connectivity
    console.log("\n🔍 Testing database connectivity...");
    const eventCount = await db.securityEvent.count();
    const blockedIPCount = await db.blockedIP.count({ where: { isActive: true } });
    
    console.log(`  SecurityEvent table: ${eventCount} records`);
    console.log(`  BlockedIP table: ${blockedIPCount} active records`);
    
    console.log("\n✅ Security migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Security migration failed:", error);
    process.exit(1);
  }
}

// Cleanup function
async function cleanup() {
  await db.$disconnect();
}

// Handle script termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Run the migration
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
}); 