"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication is handled by middleware - no need for duplicate checks
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-950 pt-20">
        <div className="p-2 sm:p-4 lg:p-8">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              {/* Sidebar Navigation */}
              <div className="w-full lg:w-64 lg:flex-shrink-0">
                <DashboardNav />
              </div>

              {/* Main Content */}
              <div className="flex-1 w-full min-w-0 max-w-full lg:max-w-5xl">
                <div className="overflow-x-hidden">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

