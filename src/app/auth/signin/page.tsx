import { SignInForm } from "./signin-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - EaseSubs",
  description: "Sign in to your EaseSubs account to manage your subscriptions.",
};

export default async function SignInPage() {
  // Authenticated user redirects are handled by middleware
  return <SignInForm />;
}
