import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.jotform.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
              "form-action 'self'",
              "frame-src 'self'",
            ].join("; "),
          },
          // Performance headers for static content only
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Specific caching for static assets
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API route caching - FIXED: No caching for TRPC and dynamic API routes
      {
        source: "/api/trpc/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
      // Only cache truly static API routes
      {
        source: "/api/(auth|webhooks)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Server external packages (moved from experimental)
  serverExternalPackages: ["@prisma/client"],

  // Turbopack configuration (now stable)
  turbopack: {
    // Turbopack handles CSS and SVG optimization automatically
    // No need for custom loaders
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
    ],
    // Enable more aggressive prefetching
    optimisticClientCache: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    output: "standalone",
    poweredByHeader: false,
    generateEtags: false,
    // Enable static optimization
    trailingSlash: false,
    // SWC minification is now enabled by default in Next.js 15+
  }),
};

export default nextConfig;
