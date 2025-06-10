"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { TRPCClientError } from "@trpc/client";

import { trpc } from "@/lib/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Make data fresh but allow some caching for performance
            staleTime: 30 * 1000, // 30 seconds
            // Keep data in cache for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Don't refetch on window focus for better UX
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Be more conservative with retries
            retry: (failureCount, error: Error) => {
              // Don't retry on auth errors
              if (
                error instanceof TRPCClientError &&
                error.data?.code === "UNAUTHORIZED"
              ) {
                return false;
              }
              // Don't retry on client errors (4xx)
              if (
                error instanceof TRPCClientError &&
                error.data?.httpStatus >= 400 &&
                error.data?.httpStatus < 500
              ) {
                return false;
              }
              return failureCount < 2;
            },
            // Disable background refetching by default
            refetchInterval: false,
            // Only refetch on mount if needed
            refetchOnMount: true,
          },
          mutations: {
            // Retry failed mutations only once
            retry: (failureCount, error: Error) => {
              // Don't retry on auth errors or client errors
              if (
                error instanceof TRPCClientError &&
                (error.data?.code === "UNAUTHORIZED" ||
                  (error.data?.httpStatus >= 400 &&
                    error.data?.httpStatus < 500))
              ) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              // Ensure no caching at HTTP level for TRPC calls
              "Cache-Control": "no-store, no-cache, must-revalidate",
            };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
