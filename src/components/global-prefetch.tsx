"use client";

import { useEffect, useRef } from "react";
import { useSessionContext } from "@/lib/session-context";
import { trpc } from "@/lib/trpc";

export function GlobalPrefetch() {
  const { session, status, isAuthenticated, isAdmin } = useSessionContext();
  const utils = trpc.useUtils();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasInitialized.current) return;

    // Only proceed if session is fully loaded
    if (status === "loading") return;

    hasInitialized.current = true;

    // Prefetch only essential pages to reduce server load
    const essentialPages = ["/", "/dashboard"];

    // Add role-specific pages only when needed
    if (isAuthenticated) {
      essentialPages.push("/dashboard/orders", "/dashboard/profile-settings");
    }

    if (isAdmin) {
      essentialPages.push("/dashboard/admin-dashboard");
    }

    // Prefetch pages with lower priority and debouncing
    const prefetchTimer = setTimeout(() => {
      essentialPages.forEach((page) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = page;
        link.as = "document";
        document.head.appendChild(link);
      });
    }, 1000); // Delay prefetching to reduce initial load

    // Only prefetch critical TRPC data for authenticated users
    if (session?.user?.id && utils) {
      const trpcTimer = setTimeout(() => {
        try {
          // Only prefetch the most essential data
          utils.cart.getItems.prefetch().catch(() => {
            // Silently fail - not critical
          });

          if (isAdmin) {
            utils.admin.getDashboardStats.prefetch().catch(() => {
              // Silently fail - not critical
            });
          }
        } catch {
          // Silently handle errors to prevent console spam
        }
      }, 2000); // Further delay for TRPC calls

      return () => {
        clearTimeout(prefetchTimer);
        clearTimeout(trpcTimer);
      };
    }

    return () => clearTimeout(prefetchTimer);
  }, [session?.user?.id, status, isAuthenticated, isAdmin, utils]);

  return null;
}

