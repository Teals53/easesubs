import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://easesubs.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/product/",
          "/legal/",
          "/auth/signin",
          "/auth/signup",
          "/blog/",
          "/search",
          "/*.jpg",
          "/*.jpeg",
          "/*.png",
          "/*.webp",
          "/*.gif",
          "/*.svg",
          "/*.css",
          "/*.js",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/_next/",
          "/checkout/",
          "/admin/",
          "*.json",
          "/private/",
          "/temp/",
          "/_vercel/",
          "/.well-known/",
          "/auth/forgot-password",
          "/auth/reset-password",
          "*/orders/*",
          "*/profile-settings",
          "*?*utm_*", // Block UTM tracking parameters
          "*?*fbclid*", // Block Facebook click tracking
          "*?*gclid*", // Block Google click tracking
          "*/search?q=*", // Block search result pages
          "*/cart",
          "*/wishlist",
          "/test/",
          "/staging/",
        ],
        crawlDelay: 1,
      },
      // Enhanced rules for major search engines
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/product/",
          "/legal/",
          "/blog/",
          "/auth/signin",
          "/auth/signup",
          "/*.css",
          "/*.js",
          "/*.jpg",
          "/*.png",
          "/*.webp",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/checkout/",
          "/admin/",
          "/private/",
          "*/orders/*",
          "*/profile-settings",
          "/auth/forgot-password",
          "/auth/reset-password",
        ],
        crawlDelay: 0,
      },
      {
        userAgent: "Bingbot",
        allow: [
          "/",
          "/product/",
          "/legal/",
          "/blog/",
          "/auth/signin",
          "/auth/signup",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/checkout/",
          "/admin/",
          "/private/",
        ],
        crawlDelay: 1,
      },
      // Allow social media crawlers for better sharing
      {
        userAgent: "facebookexternalhit",
        allow: ["/", "/product/", "/blog/", "/legal/"],
        disallow: ["/dashboard/", "/api/", "/admin/"],
        crawlDelay: 0,
      },
      {
        userAgent: "Twitterbot",
        allow: ["/", "/product/", "/blog/"],
        disallow: ["/dashboard/", "/api/", "/admin/"],
        crawlDelay: 0,
      },
      {
        userAgent: "LinkedInBot",
        allow: ["/", "/product/", "/blog/", "/legal/"],
        disallow: ["/dashboard/", "/api/", "/admin/"],
        crawlDelay: 1,
      },
      // Block AI training bots and scrapers
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "PerplexityBot",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "ClaudeBot",
        disallow: "/",
      },
      {
        userAgent: "Google-Extended",
        disallow: "/",
      },
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
      {
        userAgent: "FriendlyCrawler",
        disallow: "/",
      },
      // Block SEO tools and aggressive crawlers
      {
        userAgent: "SemrushBot",
        disallow: "/",
      },
      {
        userAgent: "AhrefsBot",
        disallow: "/",
      },
      {
        userAgent: "MJ12bot",
        disallow: "/",
      },
      {
        userAgent: "DotBot",
        disallow: "/",
      },
      {
        userAgent: "SeznamBot",
        disallow: "/",
      },
      {
        userAgent: "YandexBot",
        allow: ["/", "/product/", "/legal/"],
        disallow: ["/dashboard/", "/api/", "/admin/"],
        crawlDelay: 2,
      },
      // Block malicious bots
      {
        userAgent: [
          "scrapy",
          "wget",
          "curl",
          "python-requests",
          "node-fetch",
          "axios",
          "httpx",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
