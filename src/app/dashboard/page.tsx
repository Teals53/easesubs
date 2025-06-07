import DashboardClient from "./dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - EaseSubs",
  description: "Manage your subscriptions, orders, and account settings.",
};

export default async function DashboardPage() {
  // Authentication is handled by middleware - no need for duplicate checks
  return <DashboardClient />;
}
