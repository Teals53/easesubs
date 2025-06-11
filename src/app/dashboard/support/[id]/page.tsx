import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TicketDetailClient from "./ticket-detail-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Ticket - EaseSubs",
  description: "View and manage your support ticket.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  // Server-side authentication check
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  return <TicketDetailClient ticketId={id} />;
}
