"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  AlertTriangle,
  Activity,
  Ban,
  CheckCircle,
  RefreshCw,
  Clock,
  Lock,
  Eye,
  TrendingUp,
  Zap,
} from "lucide-react";

interface SecurityEvent {
  type: string;
  severity: string;
  source: string;
  ip?: string | null;
  riskScore: number;
  timestamp: Date;
}

interface SecurityStats {
  totalEvents: number;
  last24Hours: number;
  severityDistribution: Record<string, number>;
  topThreats: Array<{ type: string; count: number }>;
}

interface BlockedIP {
  address: string;
  blockedAt: Date;
  reason: string;
  score: number;
}

export default function SecurityDashboardPage() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "1h" | "24h" | "7d" | "30d"
  >("24h");

  // Fetch security data using tRPC
  const { data: securityStats } = trpc.admin.getSecurityStats.useQuery(
    { timeRange: selectedTimeRange },
    { refetchInterval: 30000 },
  );

  const { data: securityEventsData } = trpc.admin.getSecurityEvents.useQuery(
    { limit: 50, timeRange: selectedTimeRange },
    { refetchInterval: 30000 },
  );

  const { data: blockedIPsData, refetch: refetchBlockedIPs } =
    trpc.admin.getBlockedIPs.useQuery(undefined, { refetchInterval: 60000 });

  const unblockIPMutation = trpc.admin.unblockIP.useMutation({
    onSuccess: () => {
      refetchBlockedIPs();
    },
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (securityEventsData) {
      setSecurityEvents(securityEventsData);
    }
  }, [securityEventsData]);

  useEffect(() => {
    if (blockedIPsData) {
      setBlockedIPs(blockedIPsData);
    }
  }, [blockedIPsData]);

  useEffect(() => {
    if (securityStats) {
      setStats(securityStats);
    }
  }, [securityStats]);

  const handleRefreshAll = () => {
    // The tRPC queries will automatically refetch due to their configuration
    window.location.reload();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-400 bg-red-900/20";
      case "HIGH":
        return "text-orange-400 bg-orange-900/20";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-900/20";
      case "LOW":
        return "text-blue-400 bg-blue-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "BRUTE_FORCE_ATTEMPT":
        return <Lock className="w-4 h-4" />;
      case "SUSPICIOUS_LOGIN":
        return <Eye className="w-4 h-4" />;
      case "PRIVILEGE_ESCALATION":
        return <TrendingUp className="w-4 h-4" />;
      case "INJECTION_ATTEMPT":
        return <AlertTriangle className="w-4 h-4" />;
      case "RATE_LIMIT_EXCEEDED":
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Shield className="w-8 h-8 mr-3 text-purple-500" />
              Security Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Monitor security events, threats, and system protection status
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) =>
                setSelectedTimeRange(
                  e.target.value as "1h" | "24h" | "7d" | "30d",
                )
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              onClick={handleRefreshAll}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Events</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalEvents || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-400">
                {stats?.last24Hours || 0} in last 24h
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Blocked IPs</p>
                <p className="text-2xl font-bold text-white">
                  {blockedIPs?.length || 0}
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-400">Active blocks</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Threats</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.severityDistribution?.CRITICAL || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-400">Requires attention</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Status</p>
                <p className="text-2xl font-bold text-green-400">Secure</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-400">
                All systems operational
              </span>
            </div>
          </motion.div>
        </div>

        {/* Recent Security Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-lg"
        >
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">
              Recent Security Events
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {securityEvents && securityEvents.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {securityEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}
                        >
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {event.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {event.source} • Risk Score: {event.riskScore}
                          </p>
                          {event.ip && event.ip !== "unknown" && (
                            <p className="text-gray-500 text-xs mt-1">
                              <span className="font-mono">{event.ip}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}
                        >
                          {event.severity}
                        </span>
                        <p className="text-gray-500 text-xs mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {event.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  No security events in the selected time range
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Blocked IPs Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 border border-gray-800 rounded-lg"
        >
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">
              Blocked IP Addresses
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {blockedIPs && blockedIPs.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {blockedIPs.map((ip, index) => (
                  <div
                    key={index}
                    className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Ban className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-white font-medium">{ip.address}</p>
                        <p className="text-gray-400 text-sm">
                          Blocked: {ip.blockedAt.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Reason: {ip.reason} • Score: {ip.score}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        unblockIPMutation.mutate({ ip: ip.address })
                      }
                      disabled={unblockIPMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      {unblockIPMutation.isPending
                        ? "Unblocking..."
                        : "Unblock"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-400">No blocked IP addresses</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
