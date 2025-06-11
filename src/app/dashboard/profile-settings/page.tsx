import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "./profile-settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings - EaseSubs",
  description: "Manage your account settings and preferences.",
};

export default async function ProfileSettingsPage() {
  // Server-side authentication check
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <ProfileSettingsClient />;
}
