import { PrismaClient, BillingPeriod } from "@prisma/client";

const prisma = new PrismaClient();

// Default categories to create
const defaultCategories = [
  {
    name: "Streaming & Media",
    slug: "streaming-media",
    description: "Entertainment, streaming services, and media platforms",
    color: "#EF4444",
    icon: "Play",
    displayOrder: 1,
  },
  {
    name: "Productivity & Tools",
    slug: "productivity-tools",
    description: "Productivity software, utilities, and business tools",
    color: "#3B82F6",
    icon: "Zap",
    displayOrder: 2,
  },
  {
    name: "Creative & Design",
    slug: "creative-design",
    description: "Design software, creative tools, and artistic platforms",
    color: "#8B5CF6",
    icon: "Palette",
    displayOrder: 3,
  },
  {
    name: "Learning & Education",
    slug: "learning-education",
    description: "Educational platforms, courses, and learning resources",
    color: "#10B981",
    icon: "BookOpen",
    displayOrder: 4,
  },
  {
    name: "Social & Communication",
    slug: "social-communication",
    description: "Social networks, messaging, and communication tools",
    color: "#F59E0B",
    icon: "MessageCircle",
    displayOrder: 5,
  },
  {
    name: "Gaming",
    slug: "gaming",
    description: "Gaming platforms, game stores, and gaming services",
    color: "#EC4899",
    icon: "Gamepad2",
    displayOrder: 6,
  },
  {
    name: "Business & Finance",
    slug: "business-finance",
    description: "Business software, financial tools, and enterprise solutions",
    color: "#059669",
    icon: "Building2",
    displayOrder: 7,
  },
  {
    name: "Health & Fitness",
    slug: "health-fitness",
    description: "Health apps, fitness platforms, and wellness services",
    color: "#DC2626",
    icon: "Heart",
    displayOrder: 8,
  },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  // First, create categories
  console.log("Creating categories...");
  const categories = await Promise.all(
    defaultCategories.map(async (categoryData) => {
      return await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData,
      });
    }),
  );

  // Create a mapping for easy access
  const categoryMap = {
    "streaming-media": categories.find((c) => c.slug === "streaming-media")!.id,
    "productivity-tools": categories.find(
      (c) => c.slug === "productivity-tools",
    )!.id,
    "creative-design": categories.find((c) => c.slug === "creative-design")!.id,
    "learning-education": categories.find(
      (c) => c.slug === "learning-education",
    )!.id,
    "social-communication": categories.find(
      (c) => c.slug === "social-communication",
    )!.id,
    gaming: categories.find((c) => c.slug === "gaming")!.id,
    "business-finance": categories.find((c) => c.slug === "business-finance")!
      .id,
    "health-fitness": categories.find((c) => c.slug === "health-fitness")!.id,
  };

  // Create products with their plans
  const productsData: Array<{
    name: string;
    slug: string;
    description: string;
    categoryId: string;
  
    logoUrl?: string;
    borderColor?: string;
    isFeatured: boolean;
    displayOrder: number;
    seoTitle?: string;
    seoDescription?: string;
    plans: Array<{
      name: string;
      planType: string;
      price: number;
      originalPrice?: number;
      billingPeriod: BillingPeriod;
      duration: number;
      features: string[];
      isPopular: boolean;
    }>;
  }> = [
    // Streaming & Media
    {
      name: "YouTube",
      slug: "youtube-premium",
      description:
        "Experience YouTube like never before with YouTube Premium. Enjoy completely ad-free videos across all devices, seamless background play while using other apps, and access to YouTube Music with millions of songs and playlists. Download your favorite videos and music for offline viewing, support your favorite creators, and get exclusive access to YouTube Originals. Perfect for users who want an uninterrupted, premium viewing experience across all their devices.",
      categoryId: categoryMap["streaming-media"],

      logoUrl:
        "https://cdn.brandfetch.io/idVfYwcuQz/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#FF0000",
      isFeatured: true,
      displayOrder: 1,
      seoTitle:
        "Buy YouTube Premium 12 Months Subscription - Ad-Free Videos & Music | EaseSubs",
      seoDescription:
        "Get YouTube Premium 12-month subscription at 75% off retail price. Enjoy ad-free videos, background play, YouTube Music access, and offline downloads. Own account upgrade with instant delivery.",
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Premium Individual",
          price: 29.99,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Ad-free videos",
            "Background play",
            "YouTube Music",
            "Download videos",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
      ],
    },
    {
      name: "Spotify",
      slug: "spotify",
      description:
        "Transform your music experience with Spotify Premium, the world's leading music streaming platform. Access over 100 million songs, 5 million podcasts, and exclusive content from top artists. Enjoy crystal-clear, high-quality audio streaming without any interruptions from ads. Download your favorite tracks and playlists for offline listening, perfect for commutes or areas with poor internet connectivity. With unlimited skips and the ability to play any song on-demand, you'll have complete control over your listening experience. Available for individuals, couples, and families with flexible plan options.",
      categoryId: categoryMap["streaming-media"],
      logoUrl:
        "https://cdn.brandfetch.io/id20mQyGeY/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#1DB954",
      isFeatured: true,
      displayOrder: 2,
      seoTitle: "Buy Spotify Premium Subscriptions - Individual, Duo & Family Plans | EaseSubs",
      seoDescription: "Get Spotify Premium subscriptions up to 80% off retail prices. Choose from Individual, Duo, or Family plans with ad-free music, offline downloads, and unlimited skips. Instant delivery.",
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Individual",
          price: 24.99,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
            "High quality audio",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
        {
          name: "Individual 1 Month",
          planType: "Individual",
          price: 5.0,
          originalPrice: 9.99,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
            "High quality audio",
          ],
          isPopular: false,
        },
        {
          name: "Individual 3 Month",
          planType: "Individual 3M",
          price: 12.0,
          originalPrice: 29.97,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: [
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
            "High quality audio",
          ],
          isPopular: false,
        },
        {
          name: "Individual 6 Month",
          planType: "Individual 6M",
          price: 18.0,
          originalPrice: 59.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: [
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
            "High quality audio",
          ],
          isPopular: false,
        },
        {
          name: "Individual 12 Month",
          planType: "Individual 12M",
          price: 25.0,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
            "High quality audio",
          ],
          isPopular: false,
        },
        {
          name: "Duo 1 Month",
          planType: "Duo",
          price: 8.0,
          originalPrice: 12.99,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "2 Premium accounts",
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
          ],
          isPopular: false,
        },
        {
          name: "Duo 3 Month",
          planType: "Duo 3M",
          price: 14.0,
          originalPrice: 38.97,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: [
            "2 Premium accounts",
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
          ],
          isPopular: false,
        },
        {
          name: "Duo 6 Month",
          planType: "Duo 6M",
          price: 25.0,
          originalPrice: 77.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: [
            "2 Premium accounts",
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
          ],
          isPopular: false,
        },
        {
          name: "Duo 12 Month",
          planType: "Duo 12M",
          price: 35.0,
          originalPrice: 155.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "2 Premium accounts",
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
          ],
          isPopular: false,
        },
        {
          name: "Family 12 Month",
          planType: "Family",
          price: 55.0,
          originalPrice: 179.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "6 Premium accounts",
            "Ad-free music",
            "Offline downloads",
            "Unlimited skips",
            "Kid-safe mode",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Netflix",
      slug: "netflix",
      description:
        "Dive into the world's most popular streaming platform with Netflix. Access thousands of award-winning movies, binge-worthy TV series, documentaries, and exclusive Netflix Originals that you won't find anywhere else. From blockbuster films to critically acclaimed series like Stranger Things, The Crown, and Squid Game, Netflix offers content for every taste and age group. Enjoy seamless streaming across all your devices - TV, laptop, tablet, and smartphone - with the ability to download content for offline viewing. Choose from multiple quality options including 4K Ultra HD and HDR for the ultimate viewing experience.",
      categoryId: categoryMap["streaming-media"],
      logoUrl:
        "https://cdn.brandfetch.io/ideQwN5lBE/w/496/h/901/theme/dark/symbol.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#E50914",
      isFeatured: true,
      displayOrder: 3,
      seoTitle: "Buy Netflix Subscriptions - Basic, Standard & Premium Plans | EaseSubs",
      seoDescription: "Get Netflix subscriptions up to 70% off retail prices. Choose from Basic (720p), Standard (1080p), or Premium (4K) plans. Watch unlimited movies and TV shows with instant access.",
      plans: [
        {
          name: "Basic 6 Month",
          planType: "Basic 6M",
          price: 29.0,
          originalPrice: 41.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["720p HD", "1 Device", "Unlimited movies & shows"],
          isPopular: false,
        },
        {
          name: "Basic 12 Month",
          planType: "Basic",
          price: 55.0,
          originalPrice: 83.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["720p HD", "1 Device", "Unlimited movies & shows"],
          isPopular: false,
        },
        {
          name: "Standard 6 Month",
          planType: "Standard 6M",
          price: 62.0,
          originalPrice: 89.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["1080p Full HD", "2 Devices", "Unlimited movies & shows"],
          isPopular: true,
        },
        {
          name: "Standard 12 Month",
          planType: "Standard",
          price: 115.0,
          originalPrice: 179.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["1080p Full HD", "2 Devices", "Unlimited movies & shows"],
          isPopular: false,
        },
        {
          name: "Premium 6 Month",
          planType: "Premium 6M",
          price: 80.0,
          originalPrice: 137.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: [
            "4K Ultra HD + HDR",
            "4 Devices",
            "Unlimited movies & shows",
          ],
          isPopular: false,
        },
        {
          name: "Premium 12 Month",
          planType: "Premium",
          price: 145.0,
          originalPrice: 275.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "4K Ultra HD + HDR",
            "4 Devices",
            "Unlimited movies & shows",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Disney Plus",
      slug: "disney-plus",
      description:
        "Enter the magical world of Disney+ and experience the ultimate family streaming destination. Access the complete Disney vault including classic animated films, live-action remakes, and exclusive Disney+ Originals like The Mandalorian, WandaVision, and Loki. Enjoy content from Disney, Pixar, Marvel, Star Wars, National Geographic, and 20th Century Studios all in one place. Perfect for families and fans of all ages, Disney+ offers stunning 4K Ultra HD quality, IMAX Enhanced content, and Dolby Atmos audio. Download your favorite movies and shows for offline viewing and stream on up to 4 devices simultaneously.",
      categoryId: categoryMap["streaming-media"],
      logoUrl:
        "https://cdn.brandfetch.io/idhQlYRiX2/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#113CCF",
      isFeatured: false,
      displayOrder: 4,
      seoTitle: "Buy Disney Plus Subscription - 12 Months | EaseSubs",
      seoDescription: "Get Disney+ 12-month subscription at 45% off retail price. Access Disney, Pixar, Marvel, Star Wars content in 4K Ultra HD. Family-friendly streaming with instant delivery.",
      plans: [
        {
          name: "Individual 12 Month",
          planType: "Individual",
          price: 65.0,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "4K Ultra HD",
            "4 concurrent streams",
            "Download content",
            "All Disney content",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Crunchyroll",
      slug: "crunchyroll",
      description: "Immerse yourself in the ultimate anime streaming experience with Crunchyroll, the world's largest anime library. Access over 1,000 anime series including simulcasts of the latest episodes from Japan, classic series, and exclusive Crunchyroll Originals. Enjoy ad-free viewing with premium membership, offline downloads for mobile viewing, and access to manga and drama content. From popular series like Attack on Titan and Demon Slayer to hidden gems and classics, Crunchyroll offers something for every anime fan. Watch in HD quality with multiple subtitle and dub language options.",
      categoryId: categoryMap["streaming-media"],
      logoUrl:
        "https://cdn.brandfetch.io/id0XKwSDEq/w/200/h/200/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#FF6500",
      isFeatured: false,
      displayOrder: 5,
      seoTitle: "Buy Crunchyroll Premium Subscription - Mega Fan Plan | EaseSubs",
      seoDescription: "Get Crunchyroll Mega Fan subscription at 60% off retail price. Ad-free anime streaming, offline downloads, and access to 1000+ anime series with instant delivery.",
      plans: [
        {
          name: "Mega Fan 1 Month",
          planType: "Mega Fan",
          price: 4.0,
          originalPrice: 9.99,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "Ad-free anime",
            "HD streaming",
            "Simultaneous streaming",
            "Offline viewing",
          ],
          isPopular: false,
        },
        {
          name: "Mega Fan 12 Month",
          planType: "Mega Fan 12M",
          price: 30.0,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Ad-free anime",
            "HD streaming",
            "Simultaneous streaming",
            "Offline viewing",
          ],
          isPopular: true,
        },
      ],
    },

    // Communication & Social
    {
      name: "Discord",
      slug: "discord",
      description: "Elevate your Discord experience with Nitro, the premium subscription that transforms how you communicate and game with friends. Enjoy enhanced file upload limits up to 500MB, stream and share your screen in crisp 4K resolution at 60fps, and express yourself with custom emoji anywhere on Discord. Access exclusive Nitro-only features like animated avatars, profile banners, and premium stickers. Boost your favorite servers to unlock community perks including better audio quality, custom server banners, and increased emoji slots. Perfect for gamers, communities, and anyone who wants the ultimate Discord experience.",
      categoryId: categoryMap["social-communication"],
      logoUrl:
        "https://cdn.brandfetch.io/idM8Hlme1a/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#5865F2",
      isFeatured: true,
      displayOrder: 6,
      seoTitle: "Buy Discord Nitro Subscriptions - Boost & Classic Plans | EaseSubs",
      seoDescription: "Get Discord Nitro subscriptions up to 60% off retail prices. Enhanced file uploads, 4K streaming, custom emoji, and server boosts. Instant activation.",
      plans: [
        {
          name: "Yearly Nitro Boost",
          planType: "Nitro Boost",
          price: 39.99,
          originalPrice: 99.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Server boosts",
            "Enhanced upload limit",
            "HD video streaming",
            "Custom emoji",
          ],
          isPopular: true,
        },
        {
          name: "Yearly Nitro Classic",
          planType: "Nitro Classic",
          price: 19.99,
          originalPrice: 49.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Enhanced upload limit",
            "Custom emoji",
            "HD video streaming",
          ],
          isPopular: false,
        },
        {
          name: "1 Month 14X Boost",
          planType: "Server Boost 1M",
          price: 14.99,
          originalPrice: 69.86,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: ["14 Server boosts", "Enhanced server features"],
          isPopular: false,
        },
        {
          name: "3 Month 14X Boost",
          planType: "Server Boost 3M",
          price: 19.99,
          originalPrice: 209.58,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: ["14 Server boosts", "Enhanced server features"],
          isPopular: false,
        },
      ],
    },
    {
      name: "Telegram",
      slug: "telegram",
      description: "Enhance your messaging experience with Telegram Premium, the advanced version of the world's most secure messaging platform. Enjoy increased file sharing limits up to 4GB, faster download speeds, exclusive animated emoji and stickers, and the ability to organize chats with unlimited folders. Access advanced features like transcription for voice messages, translation tools, and premium reactions. Create a personalized experience with unique usernames, custom app icons, and animated profile pictures. Perfect for power users, content creators, and anyone who values privacy and advanced messaging features in their daily communication.",
      categoryId: categoryMap["social-communication"],
      logoUrl:
        "https://cdn.brandfetch.io/id68S6e-Gp/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#0088CC",
      isFeatured: true,
      displayOrder: 7,
      seoTitle: "Buy Telegram Premium Subscriptions - Gift Plans Available | EaseSubs",
      seoDescription:
        "Get Telegram Premium subscriptions up to 70% off retail prices. Enhanced messaging, 4GB file sharing, exclusive stickers, and advanced features. Gift options available.",
      plans: [
        {
          name: "Gift Premium 12M",
          planType: "Gift Premium 12M",
          price: 33.99,
          originalPrice: 59.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Increased limits",
            "Faster downloads",
            "Exclusive stickers",
            "Advanced features",
          ],
          isPopular: true,
        },
        {
          name: "Gift Premium 6M",
          planType: "Gift Premium 6M",
          price: 21.99,
          originalPrice: 29.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: [
            "Increased limits",
            "Faster downloads",
            "Exclusive stickers",
            "Advanced features",
          ],
          isPopular: false,
        },
        {
          name: "Gift Premium 3M",
          planType: "Gift Premium 3M",
          price: 13.99,
          originalPrice: 14.97,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: [
            "Increased limits",
            "Faster downloads",
            "Exclusive stickers",
            "Advanced features",
          ],
          isPopular: false,
        },
        {
          name: "Gift Membership 3 Month",
          planType: "Gift Membership 3M",
          price: 15.0,
          originalPrice: 14.97,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: ["Premium features", "Enhanced limits"],
          isPopular: false,
        },
        {
          name: "Gift Membership 6 Month",
          planType: "Gift Membership 6M",
          price: 22.0,
          originalPrice: 29.94,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["Premium features", "Enhanced limits"],
          isPopular: false,
        },
        {
          name: "Gift Membership 12 Month",
          planType: "Gift Membership",
          price: 35.0,
          originalPrice: 59.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["Premium features", "Enhanced limits"],
          isPopular: false,
        },
      ],
    },
    {
      name: "Twitter / X",
      slug: "twitter-x",
      description: "Enhanced Twitter/X experience with premium features.",
      categoryId: categoryMap["social-communication"],
      logoUrl:
        "https://cdn.brandfetch.io/idS5WhqBbM/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#1DA1F2",
      isFeatured: false,
      displayOrder: 8,
      seoTitle: "Twitter/X Premium Subscriptions | EaseSubs",
      seoDescription:
        "Get Twitter/X Premium subscriptions at discounted prices.",
      plans: [
        {
          name: "Basic 12M Individual Own Account Upgrade",
          planType: "Basic",
          price: 51.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Edit posts",
            "Longer posts",
            "Reader mode",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
        {
          name: "Premium 12M Individual Own Account Upgrade",
          planType: "Premium",
          price: 84.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "All Basic features",
            "Priority support",
            "Advanced analytics",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
        {
          name: "Premium Plus 12M Individual Own Account Upgrade",
          planType: "Premium Plus",
          price: 249.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "All Premium features",
            "Highest priority",
            "Advanced features",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },

    // Dating
    {
      name: "Tinder",
      slug: "tinder",
      description: "Enhanced Tinder experience with premium dating features.",
      categoryId: categoryMap["social-communication"],
      logoUrl:
        "https://cdn.brandfetch.io/id2Hf2OMju/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#FE3C72",
      isFeatured: false,
      displayOrder: 9,
      seoTitle: "Tinder Premium Subscriptions | EaseSubs",
      seoDescription: "Get Tinder Premium subscriptions at discounted prices.",
      plans: [
        {
          name: "Plus 1 Month",
          planType: "Plus",
          price: 5.0,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "Unlimited likes",
            "Rewind",
            "Passport",
            "5 Super Likes per day",
          ],
          isPopular: false,
        },
        {
          name: "Plus 6 Month",
          planType: "Plus 6M",
          price: 15.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: [
            "Unlimited likes",
            "Rewind",
            "Passport",
            "5 Super Likes per day",
          ],
          isPopular: false,
        },
        {
          name: "Gold 1 Month",
          planType: "Gold",
          price: 15.0,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: ["All Plus features", "See who likes you", "Top Picks"],
          isPopular: true,
        },
        {
          name: "Gold 3 Month",
          planType: "Gold 3M",
          price: 22.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: ["All Plus features", "See who likes you", "Top Picks"],
          isPopular: false,
        },
        {
          name: "Gold 6 Month",
          planType: "Gold 6M",
          price: 30.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["All Plus features", "See who likes you", "Top Picks"],
          isPopular: false,
        },
        {
          name: "Gold 12 Month",
          planType: "Gold 12M",
          price: 50.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["All Plus features", "See who likes you", "Top Picks"],
          isPopular: false,
        },
        {
          name: "Platinum 6 Month",
          planType: "Platinum",
          price: 65.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: [
            "All Gold features",
            "Message before matching",
            "Priority likes",
          ],
          isPopular: false,
        },
      ],
    },

    // Education & Learning
    {
      name: "Duolingo",
      slug: "duolingo",
      description: "Master new languages with Duolingo Plus, the world's most popular language learning platform used by over 500 million learners. Break down language barriers with interactive lessons that make learning fun and effective through gamification, streaks, and achievements. Access ad-free learning experiences, download lessons for offline study during commutes or travel, and never worry about running out of hearts with unlimited mistakes. Get detailed progress tracking, advanced learning features, and personalized lesson plans that adapt to your learning style. Perfect for beginners and advanced learners alike, supporting over 40 languages including Spanish, French, German, Japanese, Korean, and many more.",
      categoryId: categoryMap["learning-education"],
      logoUrl:
        "https://cdn.brandfetch.io/id4D-_pnvt/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#58CC02",
      isFeatured: true,
      displayOrder: 10,
      seoTitle: "Buy Duolingo Plus Subscriptions - Individual & Family Plans | EaseSubs",
      seoDescription: "Get Duolingo Plus subscriptions up to 70% off retail prices. Ad-free language learning, offline lessons, unlimited hearts for 40+ languages. Own account upgrades available.",
      plans: [
        {
          name: "Plus 12M Individual Own Account Upgrade",
          planType: "Plus Individual",
          price: 34.99,
          originalPrice: 83.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Ad-free learning",
            "Offline lessons",
            "Unlimited hearts",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
        {
          name: "Individual 12 Month",
          planType: "Individual",
          price: 25.0,
          originalPrice: 83.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["Ad-free learning", "Offline lessons", "Unlimited hearts"],
          isPopular: false,
        },
        {
          name: "Family 12 Month",
          planType: "Family",
          price: 40.0,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Up to 6 members",
            "Ad-free learning",
            "Offline lessons",
            "Unlimited hearts",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Busuu",
      slug: "busuu",
      description: "Accelerate your language learning journey with Busuu, the AI-powered language learning platform trusted by over 120 million users worldwide. Experience personalized lesson plans tailored to your learning style, receive feedback from native speakers in the global community, and practice with speech recognition technology. Access comprehensive courses for 12 languages including Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, and more. Study at your own pace with offline lessons, earn official McGraw-Hill Education certificates, and track your progress with detailed analytics. Perfect for serious language learners who want to achieve fluency faster.",
      categoryId: categoryMap["learning-education"],
      logoUrl:
        "https://cdn.brandfetch.io/id-_d9IzaF/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#1FB6E5",
      isFeatured: false,
      displayOrder: 11,
      seoTitle: "Buy Busuu Premium Subscription - AI Language Learning | EaseSubs",
      seoDescription: "Get Busuu Premium 12-month subscription at 65% off retail price. AI-powered language learning with native speaker feedback for 12 languages. Own account upgrade.",
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Individual Own",
          price: 27.99,
          originalPrice: 83.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Complete courses",
            "AI feedback",
            "Offline mode",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
        {
          name: "12M Individual New Account Upgrade",
          planType: "Individual New",
          price: 12.99,
          originalPrice: 83.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Complete courses",
            "AI feedback",
            "Offline mode",
            "New Account",
          ],
          isPopular: true,
        },
      ],
    },
    {
      name: "Rosetta Stone",
      slug: "rosetta-stone",
      description: "Learn languages with immersive Rosetta Stone method.",
      categoryId: categoryMap["learning-education"],
      logoUrl:
        "https://cdn.brandfetch.io/idaUY35oPh/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#FFCC00",
      isFeatured: false,
      displayOrder: 12,
      plans: [
        {
          name: "3M Individual Own Account Upgrade",
          planType: "Individual 3M",
          price: 8.99,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: [
            "24 languages",
            "Speech recognition",
            "Offline lessons",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Individual",
          price: 25.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "24 languages",
            "Speech recognition",
            "Offline lessons",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
        {
          name: "Lifetime Individual Own Account Upgrade",
          planType: "Lifetime",
          price: 54.99,
          billingPeriod: BillingPeriod.LIFETIME,
          duration: 36500, // 100 years as lifetime
          features: [
            "24 languages",
            "Speech recognition",
            "Offline lessons",
            "Lifetime access",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "SoloLearn",
      slug: "sololearn",
      description: "Learn coding with interactive lessons and challenges.",
      categoryId: categoryMap["learning-education"],
      logoUrl:
        "https://cdn.brandfetch.io/idLioNtcc7/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#2E8B57",
      isFeatured: false,
      displayOrder: 13,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Pro",
          price: 39.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Ad-free learning",
            "Goal setting",
            "No ads",
            "Practice goals",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Chess.com",
      slug: "chess-com",
      description: "Improve your chess skills with premium features.",
      categoryId: categoryMap["learning-education"],
      logoUrl:
        "https://cdn.brandfetch.io/id3xkMkAED/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#769656",
      isFeatured: false,
      displayOrder: 14,
      plans: [
        {
          name: "12 Month Upgrade Gold",
          planType: "Gold",
          price: 35.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Unlimited puzzles",
            "Advanced analysis",
            "Lessons",
            "No ads",
          ],
          isPopular: true,
        },
        {
          name: "Platinum",
          planType: "Platinum",
          price: 50.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["All Gold features", "Video lessons", "Premium analysis"],
          isPopular: false,
        },
        {
          name: "Diamond",
          planType: "Diamond",
          price: 65.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "All Platinum features",
            "Master classes",
            "Premium support",
          ],
          isPopular: false,
        },
      ],
    },

    // Productivity & Professional
    {
      name: "LinkedIn",
      slug: "linkedin",
      description: "Professional networking with LinkedIn Premium features.",
      categoryId: categoryMap["productivity-tools"],
      logoUrl:
        "https://cdn.brandfetch.io/idJFz6sAsl/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#0077B5",
      isFeatured: false,
      displayOrder: 15,
      seoTitle: "LinkedIn Premium Subscriptions | EaseSubs",
      seoDescription:
        "Get LinkedIn Premium subscriptions at discounted prices.",
      plans: [
        {
          name: "Career 1 month",
          planType: "Career",
          price: 6.0,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "InMail messages",
            "See who viewed profile",
            "Advanced search",
          ],
          isPopular: false,
        },
        {
          name: "Career 12 Months",
          planType: "Career 12M",
          price: 43.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "InMail messages",
            "See who viewed profile",
            "Advanced search",
          ],
          isPopular: true,
        },
        {
          name: "Business 1 month",
          planType: "Business",
          price: 12.0,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "All Career features",
            "Business insights",
            "Unlimited people browsing",
          ],
          isPopular: false,
        },
        {
          name: "Business 12 Months",
          planType: "Business 12M",
          price: 75.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "All Career features",
            "Business insights",
            "Unlimited people browsing",
          ],
          isPopular: false,
        },
        {
          name: "Sales Navigator 1 month",
          planType: "Sales Navigator",
          price: 125.0,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "Advanced lead search",
            "Lead recommendations",
            "Real-time insights",
          ],
          isPopular: false,
        },
        {
          name: "Sales Navigator 12 Months",
          planType: "Sales Navigator 12M",
          price: 1100.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Advanced lead search",
            "Lead recommendations",
            "Real-time insights",
          ],
          isPopular: false,
        },
        {
          name: "Recruiter Lite 1 month",
          planType: "Recruiter Lite",
          price: 235.0,
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: [
            "Advanced candidate search",
            "InMail credits",
            "Talent insights",
          ],
          isPopular: false,
        },
        {
          name: "Recruiter Lite 12 Months",
          planType: "Recruiter Lite 12M",
          price: 1815.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Advanced candidate search",
            "InMail credits",
            "Talent insights",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Termius",
      slug: "termius",
      description: "SSH client and terminal with premium features.",
      categoryId: categoryMap["productivity-tools"],
      logoUrl:
        "https://cdn.brandfetch.io/id821vPAob/w/200/h/200/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#000000",
      isFeatured: false,
      displayOrder: 16,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Pro",
          price: 34.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Sync across devices",
            "SFTP support",
            "Snippets",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },

    // Creative & Design
    {
      name: "Canva",
      slug: "canva",
      description:
        "Unleash your creativity with Canva Pro, the ultimate design platform trusted by millions of creators, marketers, and businesses worldwide. Access over 100 million premium photos, videos, graphics, and audio clips, plus thousands of professionally designed templates for social media posts, presentations, logos, flyers, and more. Utilize powerful AI-powered tools including the background remover, magic resize feature, and brand kit to maintain consistency across all your designs. Collaborate seamlessly with team members, schedule content directly to social platforms, and organize your designs with unlimited folders. Perfect for entrepreneurs, social media managers, content creators, and anyone who wants to create stunning visuals without design experience.",
      categoryId: categoryMap["creative-design"],
      logoUrl:
        "https://cdn.brandfetch.io/id9mVQlyB1/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#00C4CC",
      isFeatured: true,
      displayOrder: 17,
      seoTitle: "Buy Canva Pro Subscription - 12 Months Premium Design Tools | EaseSubs",
      seoDescription: "Get Canva Pro 12-month subscription at 65% off retail price. Access 100M+ premium assets, AI tools, brand kit, and collaboration features. Own account upgrade.",
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Pro",
          price: 39.99,
          originalPrice: 119.88,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Premium templates",
            "Background remover",
            "Brand kit",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
      ],
    },
    {
      name: "PicsArt",
      slug: "picsart",
      description: "Photo editing and design with premium features.",
      categoryId: categoryMap["creative-design"],
      logoUrl:
        "https://cdn.brandfetch.io/idunI7Cam3/w/1024/h/1024/idvZ5-klGz.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#FF3997",
      isFeatured: false,
      displayOrder: 18,
      plans: [
        {
          name: "Plus 12M Individual Own Account Upgrade",
          planType: "Plus",
          price: 7.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Premium stickers",
            "Ad-free editing",
            "HD exports",
            "Own Account Upgrade",
          ],
          isPopular: true,
        },
        {
          name: "Pro 12M Individual Own Account Upgrade",
          planType: "Pro",
          price: 9.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "All Plus features",
            "Advanced tools",
            "Premium fonts",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "Adobe Lightroom",
      slug: "adobe-lightroom",
      description: "Professional photo editing and organization.",
      categoryId: categoryMap["creative-design"],
      logoUrl:
        "https://cdn.brandfetch.io/id_KsyK7J9/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#31A8FF",
      isFeatured: false,
      displayOrder: 19,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Individual",
          price: 21.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Desktop and mobile apps",
            "Cloud storage",
            "Advanced editing",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },
    {
      name: "CapCut",
      slug: "capcut",
      description: "Video editing with professional features.",
      categoryId: categoryMap["creative-design"],
      logoUrl:
        "https://cdn.brandfetch.io/idUmqKFgE3/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#000000",
      isFeatured: false,
      displayOrder: 20,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Pro",
          price: 54.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Premium templates",
            "No watermark",
            "Advanced effects",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },

    // Fitness & Health
    {
      name: "Strava",
      slug: "strava",
      description: "Fitness tracking and social features for athletes.",
      categoryId: categoryMap["health-fitness"],
      logoUrl:
        "https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
      borderColor: "#FC4C02",
      isFeatured: false,
      displayOrder: 21,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Premium",
          price: 34.99,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: [
            "Advanced analytics",
            "Route planning",
            "Training plans",
            "Own Account Upgrade",
          ],
          isPopular: false,
        },
      ],
    },
  ];

  // Create products and their plans
  for (const productData of productsData) {
    console.log(`Creating product: ${productData.name}`);

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        logoUrl: productData.logoUrl,
        borderColor: productData.borderColor,
        isFeatured: productData.isFeatured,
        displayOrder: productData.displayOrder,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
      },
      create: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        categoryId: productData.categoryId,
        logoUrl: productData.logoUrl,
        borderColor: productData.borderColor,
        isFeatured: productData.isFeatured,
        displayOrder: productData.displayOrder,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
      },
    });

    // Create plans for this product
    for (const planData of productData.plans) {
      await prisma.productPlan.upsert({
        where: {
          productId_planType: {
            productId: product.id,
            planType: planData.planType,
          },
        },
        update: {
          name: planData.name,
          price: planData.price,
          originalPrice: planData.originalPrice,
          billingPeriod: planData.billingPeriod,
          duration: planData.duration,
          features: planData.features,
          isPopular: planData.isPopular,
          deliveryType: "MANUAL",
        },
        create: {
          productId: product.id,
          name: planData.name,
          planType: planData.planType,
          price: planData.price,
          originalPrice: planData.originalPrice,
          billingPeriod: planData.billingPeriod,
          duration: planData.duration,
          features: planData.features,
          isPopular: planData.isPopular,
          deliveryType: "MANUAL",
        },
      });
    }
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
