import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  // Authentication is handled by middleware - no need for duplicate checks
  return <DashboardClient />;
}
