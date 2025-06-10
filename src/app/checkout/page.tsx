import { CheckoutForm } from "./checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - EaseSubs",
  description:
    "Complete your subscription purchase securely and start saving today.",
};

export default async function CheckoutPage() {
  // Authentication is handled by middleware
  return <CheckoutForm />;
}
