import type { NextConfig } from "next";
import { SECURITY_HEADERS, HTTPS_CONFIG, SECURITY_REDIRECTS } from "@/lib/security-config";

const nextConfig: NextConfig = {
  /* config options here */

  // SEO Configuration
  trailingSlash: false, // Clean URLs without trailing slashes
  poweredByHeader: false, // Remove X-Powered-By header for security
  generateEtags: false, // Reduce server fingerprinting

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Apply security headers from centralized configuration
          ...Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
            key,
            value,
          })),
          // CSP header is now set dynamically in middleware.ts with nonces
          // {
          //   key: "Content-Security-Policy",
          //   value: process.env.NODE_ENV === "development" 
          //     ? CSP_DIRECTIVES.development.join("; ")
          //     : CSP_DIRECTIVES.production().join("; "),
          // },
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
      // Enhanced font caching
      {
        source: "/_next/static/media/(.*)",
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

  // Enhanced image optimization with security and performance
  images: {
    domains: [
      "lh3.googleusercontent.com", 
      "avatars.githubusercontent.com",
      "cdn.brandfetch.io",
      "via.placeholder.com"
    ],
    formats: ["image/avif", "image/webp"], // AVIF first for better compression
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true, // Enable SVG with security measures
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enhanced image optimization settings
    loader: "default",
    // Handle external image failures gracefully - disable optimization in dev for easier debugging
    unoptimized: process.env.NODE_ENV === "development"
  },

  // Enhanced compression
  compress: true,

  // Server external packages (moved from experimental)
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // Turbopack configuration (now stable)
  turbopack: {
    // Turbopack handles CSS and SVG optimization automatically
    // No need for custom loaders
    // Handle packages with dynamic requires
    resolveExtensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },

  // Enhanced performance optimizations
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
      "@tanstack/react-query",
      "@trpc/client",
      "@trpc/react-query",
      "class-variance-authority",
      "tailwind-merge",
      "zustand",
    ],
    // Enable more aggressive prefetching and optimizations
    optimisticClientCache: true,
    // Security-related experimental features
    strictNextHead: true,
    // Enable memory optimization
    memoryBasedWorkersCount: true,
    // Better tree shaking
    esmExternals: true,
  },

  // Enhanced compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"] // Keep error and warning logs
    } : false,
    // Remove React dev tools and test attributes in production
    reactRemoveProperties: process.env.NODE_ENV === "production" ? {
      properties: ["^data-testid$"]
    } : false,
    // Enable SWC minification
    styledComponents: false, // We're using Tailwind
  },

  // Enhanced security settings
  async redirects() {
    return [
      // HTTPS enforcement - redirect HTTP to HTTPS in production
      ...(HTTPS_CONFIG.enabled ? [{
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: `https://${HTTPS_CONFIG.domain}/:path*`,
        permanent: true,
      }] : []),
      
      // Force HTTPS for specific sensitive routes
      ...HTTPS_CONFIG.sensitiveRoutes.map(route => ({
        source: `${route}/:path*`,
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: `https://${HTTPS_CONFIG.domain}${route}/:path*`,
        permanent: true,
      })),

      // Redirect common attack vectors using centralized configuration
      ...SECURITY_REDIRECTS.map(source => ({
        source,
        destination: '/404',
        permanent: true,
      })),

      // SEO redirects for clean URLs
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // Redirect old product URLs if any
      {
        source: '/products/:slug',
        destination: '/product/:slug',
        permanent: true,
      },
    ];
  },

  // SEO-friendly rewrites
  async rewrites() {
    return [
      // Clean URLs for sitemap and robots
      {
        source: '/sitemap.xml',
        destination: '/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/robots',
      },
    ];
  },

  // Enhanced production optimizations with security
  ...(process.env.NODE_ENV === "production" && {
    output: "standalone",
    // Security: disable source maps in production
    productionBrowserSourceMaps: false,
    // Enable modern JavaScript
    modularizeImports: {
      "lucide-react": {
        transform: "lucide-react/dist/esm/icons/{{member}}",
      },
    },
  }),

  // Enhanced webpack configuration for better optimization
  webpack: (config, { dev }) => {
    // Only optimize in production
    if (!dev) {
      // Optimize bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate vendor chunks for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
            // Separate common chunks
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 5,
              reuseExistingChunk: true,
            },
            // UI library chunks
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: "ui-libs",
              chunks: "all",
              priority: 20,
            },
          },
        },
      };

      // Enable better tree shaking
      config.optimization.usedExports = true;
      config.optimization.providedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },
};

export default nextConfig;

