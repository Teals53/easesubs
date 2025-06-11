import { SignUpForm } from "./signup-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - EaseSubs",
  description:
    "Create your EaseSubs account and start saving on subscriptions.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Server-side authentication check
  const session = await auth();

  if (session?.user) {
    // User is already authenticated, redirect to dashboard or callback URL
    const params = await searchParams;
    const callbackUrl = params.callbackUrl;
    const redirectUrl =
      callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
    redirect(redirectUrl);
  }

  return <SignUpForm />;
}
