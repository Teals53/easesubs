import { NextRequest, NextResponse } from "next/server";
import { rateLimitUtils } from "@/lib/enhanced-rate-limit";

export async function GET(request: NextRequest) {
  // Simple admin check - you should implement proper admin authentication
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get("action");

  switch (action) {
    case "status":
      return NextResponse.json({
        entries: rateLimitUtils.getAllEntries(),
        suspiciousIPs: rateLimitUtils.getSuspiciousIPs(),
        totalEntries: rateLimitUtils.getAllEntries().length,
      });

    case "clear-all":
      rateLimitUtils.clearAll();
      return NextResponse.json({ message: "All rate limits cleared" });

    case "clear-ip":
      const ip = request.nextUrl.searchParams.get("ip");
      if (ip) {
        rateLimitUtils.clearIdentifier(ip);
        rateLimitUtils.clearSuspiciousIP(ip);
        return NextResponse.json({ message: `Cleared rate limits for IP: ${ip}` });
      }
      return NextResponse.json({ error: "IP parameter required" }, { status: 400 });

    default:
      return NextResponse.json({
        message: "Rate Limit Admin API",
        availableActions: ["status", "clear-all", "clear-ip"],
        usage: {
          status: "GET /api/admin/rate-limits?action=status",
          clearAll: "GET /api/admin/rate-limits?action=clear-all",
          clearIP: "GET /api/admin/rate-limits?action=clear-ip&ip=1.2.3.4",
        },
      });
  }
} 