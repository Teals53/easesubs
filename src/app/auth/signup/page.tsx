import { SignUpForm } from "./signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - EaseSubs",
  description:
    "Create your EaseSubs account and start saving on subscriptions.",
};

export default async function SignUpPage() {
  // Authenticated user redirects are handled by middleware
  return <SignUpForm />;
}
