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
            value: "camera=(), microphone=(), geolocation=(), usb=(), serial=(), bluetooth=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: process.env.NODE_ENV === "development" 
              ? [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.jotform.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "img-src 'self' data: https: blob:",
                  "connect-src 'self' ws: wss: https://fonts.googleapis.com https://fonts.gstatic.com",
                  "form-action 'self'",
                  "frame-src 'none'",
                  "object-src 'none'",
                  "base-uri 'self'",
                ].join("; ")
              : [
                  "default-src 'self'",
                  "script-src 'self' https://js.jotform.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "img-src 'self' data: https: blob:",
                  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
                  "form-action 'self'",
                  "frame-src 'none'",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "upgrade-insecure-requests",
                ].join("; "),
          },
          // Remove overly broad cache headers from global scope
        ],
      },
      // Specific caching for static assets only
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // No caching for TRPC and dynamic API routes
      {
        source: "/api/trpc/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      // No caching for auth and webhook endpoints
      {
        source: "/api/(auth|webhooks)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },

  // Image optimization with security
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false, // Disabled for security
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Server external packages (moved from experimental)
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

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
    // Security-related experimental features
    strictNextHead: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
    // Remove React dev tools
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  // Production optimizations with security
  ...(process.env.NODE_ENV === "production" && {
    output: "standalone",
    poweredByHeader: false, // Security: hide server info
    generateEtags: false, // Reduce fingerprinting
    trailingSlash: false,
    // Security: disable source maps in production
    productionBrowserSourceMaps: false,
  }),

  // Enhanced security settings
  async redirects() {
    return [
      // Redirect common attack vectors
      {
        source: '/wp-admin/:path*',
        destination: '/404',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/admin-dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'next-auth.session-token',
          },
        ],
      },
    ];
  },

  // Security headers for development
  ...(process.env.NODE_ENV === "development" && {
    eslint: {
      ignoreDuringBuilds: false,
    },
    typescript: {
      ignoreBuildErrors: false,
    },
  }),
};

export default nextConfig;
