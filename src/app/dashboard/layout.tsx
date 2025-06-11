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
    <div className="min-h-screen bg-gray-950 flex flex-col dashboard-layout">
      <Header />
      <main className="flex-1 pt-20">
        <div className="p-2 sm:p-4 lg:p-8 h-full dashboard-container">
          <div className="container mx-auto px-2 sm:px-4 h-full">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 h-full">
              {/* Sidebar Navigation */}
              <div className="w-full lg:w-64 lg:flex-shrink-0">
                <DashboardNav />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="h-full overflow-y-auto dashboard-content">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
