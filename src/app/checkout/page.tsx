import { CheckoutForm } from "./checkout-form";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Checkout - EaseSubs",
  description:
    "Complete your subscription purchase securely and start saving today.",
};

export default async function CheckoutPage() {
  // Server-side authentication check
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/checkout");
  }

  return <CheckoutForm />;
}
