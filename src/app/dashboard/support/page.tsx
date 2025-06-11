import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupportClient from "./support-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support - EaseSubs",
  description: "Get help and manage your support tickets.",
};

export default async function SupportPage() {
  // Server-side authentication check
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <SupportClient />;
}
