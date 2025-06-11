import DashboardClient from "./dashboard-client";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard - EaseSubs",
  description: "Manage your subscriptions, orders, and account settings.",
};

export default async function DashboardPage() {
  // Server-side authentication check
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <DashboardClient />;
}
