import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrdersClient from "./orders-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders - EaseSubs",
  description: "View and manage your subscription orders.",
};

export default async function OrdersPage() {
  // Server-side authentication check
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <OrdersClient />;
}
