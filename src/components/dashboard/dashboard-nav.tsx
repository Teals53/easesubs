"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  User,
  LifeBuoy,
  LogOut,
  Shield,
  Home,
  Package,
  Users,
  BarChart3,
  Ticket,
  LucideIcon,
  Menu,
  X,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export default function DashboardNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "ADMIN";

  const baseNavItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "orders", label: "Orders", icon: Package, href: "/dashboard/orders" },
    {
      id: "support",
      label: "Support",
      icon: LifeBuoy,
      href: "/dashboard/support",
    },
    {
      id: "profile-settings",
      label: "Profile & Settings",
      icon: User,
      href: "/dashboard/profile-settings",
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      id: "admin-dashboard",
      label: "Admin Dashboard",
      icon: BarChart3,
      href: "/dashboard/admin-dashboard",
    },
    {
      id: "admin-security",
      label: "Security Dashboard",
      icon: Shield,
      href: "/dashboard/admin-security",
    },
    {
      id: "admin-users",
      label: "User Management",
      icon: Users,
      href: "/dashboard/admin-users",
    },
    {
      id: "admin-products",
      label: "Product Management",
      icon: Package,
      href: "/dashboard/admin-products",
    },
    {
      id: "admin-stock",
      label: "Stock Management",
      icon: Warehouse,
      href: "/dashboard/admin-stock",
    },
    {
      id: "admin-orders",
      label: "Order Management",
      icon: Package,
      href: "/dashboard/admin-orders",
    },
    {
      id: "admin-support",
      label: "Support Tickets",
      icon: Ticket,
      href: "/dashboard/admin-support",
    },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full bg-gray-900/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
            <span className="text-white font-medium">Dashboard Menu</span>
          </div>
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-400" />
          ) : (
            <Menu className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <div
        className={`${isMobileMenuOpen ? "block" : "hidden"} lg:block bg-gray-900/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 lg:sticky lg:top-8 flex flex-col`}
      >
        {/* User Profile Section - Moved to Top */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {user?.name?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              {isAdmin && (
                <p className="text-xs text-purple-400 font-medium">Admin</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {/* Regular User Navigation */}
          <div className="space-y-1">
            {baseNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:bg-gray-800/70 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="font-medium truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-4 border-t border-gray-700/50">
              <div className="flex items-center px-4 py-2 mb-2">
                <Shield className="h-4 w-4 text-purple-400 mr-2 flex-shrink-0" />
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-purple-600 text-white shadow-lg"
                          : "text-purple-400 hover:bg-purple-900/30 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Sign Out Button - Moved to Bottom */}
        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
