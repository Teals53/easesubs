import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FAQClient from "./faq-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Support - EaseSubs",
  description: "Frequently asked questions about EaseSubs.",
};

export default async function FAQPage() {
  // Server-side authentication check
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <FAQClient />;
}
