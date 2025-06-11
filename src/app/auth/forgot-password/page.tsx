import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ForgotPasswordClient from "./forgot-password-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - EaseSubs",
  description: "Reset your EaseSubs account password.",
};

export default async function ForgotPasswordPage({
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

  return <ForgotPasswordClient />;
}
