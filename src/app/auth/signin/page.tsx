import { SignInForm } from "./signin-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - EaseSubs",
  description: "Sign in to your EaseSubs account to manage your subscriptions.",
};

export default async function SignInPage({
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

  return <SignInForm />;
}
