import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResetPasswordClient from "./reset-password-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - EaseSubs",
  description: "Reset your EaseSubs account password.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; callbackUrl?: string };
}) {
  // Server-side authentication check
  const session = await auth();
  
  if (session?.user) {
    // User is already authenticated, redirect to dashboard or callback URL
    const callbackUrl = searchParams.callbackUrl;
    const redirectUrl = callbackUrl && callbackUrl.startsWith("/") 
      ? callbackUrl 
      : "/dashboard";
    redirect(redirectUrl);
  }

  return <ResetPasswordClient token={searchParams.token} />;
}
