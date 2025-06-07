import { PrismaClient, BillingPeriod } from "@prisma/client";

const prisma = new PrismaClient();

// Default categories to create
const defaultCategories = [
  {
    name: 'Streaming & Media',
    slug: 'streaming-media',
    description: 'Entertainment, streaming services, and media platforms',
    color: '#EF4444',
    icon: 'Play',
    displayOrder: 1
  },
  {
    name: 'Productivity & Tools',
    slug: 'productivity-tools',
    description: 'Productivity software, utilities, and business tools',
    color: '#3B82F6',
    icon: 'Zap',
    displayOrder: 2
  },
  {
    name: 'Creative & Design',
    slug: 'creative-design',
    description: 'Design software, creative tools, and artistic platforms',
    color: '#8B5CF6',
    icon: 'Palette',
    displayOrder: 3
  },
  {
    name: 'Learning & Education',
    slug: 'learning-education',
    description: 'Educational platforms, courses, and learning resources',
    color: '#10B981',
    icon: 'BookOpen',
    displayOrder: 4
  },
  {
    name: 'Social & Communication',
    slug: 'social-communication',
    description: 'Social networks, messaging, and communication tools',
    color: '#F59E0B',
    icon: 'MessageCircle',
    displayOrder: 5
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming platforms, game stores, and gaming services',
    color: '#EC4899',
    icon: 'Gamepad2',
    displayOrder: 6
  },
  {
    name: 'Business & Finance',
    slug: 'business-finance',
    description: 'Business software, financial tools, and enterprise solutions',
    color: '#059669',
    icon: 'Building2',
    displayOrder: 7
  },
  {
    name: 'Health & Fitness',
    slug: 'health-fitness',
    description: 'Health apps, fitness platforms, and wellness services',
    color: '#DC2626',
    icon: 'Heart',
    displayOrder: 8
  }
];

async function main() {
  console.log("ğŸŒ± Starting database seeding...");

  // First, create categories
  console.log("Creating categories...");
  const categories = await Promise.all(
    defaultCategories.map(async (categoryData) => {
      return await prisma.category.create({
        data: categoryData
      });
    })
  );

  // Create a mapping for easy access
  const categoryMap = {
    'streaming-media': categories.find(c => c.slug === 'streaming-media')!.id,
    'productivity-tools': categories.find(c => c.slug === 'productivity-tools')!.id,
    'creative-design': categories.find(c => c.slug === 'creative-design')!.id,
    'learning-education': categories.find(c => c.slug === 'learning-education')!.id,
    'social-communication': categories.find(c => c.slug === 'social-communication')!.id,
    'gaming': categories.find(c => c.slug === 'gaming')!.id,
    'business-finance': categories.find(c => c.slug === 'business-finance')!.id,
    'health-fitness': categories.find(c => c.slug === 'health-fitness')!.id,
  };

  // Create products with their plans
  const productsData: Array<{
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    logoName?: string;
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
        "Ad-free YouTube videos, background play, and YouTube Music included.",
      categoryId: categoryMap['streaming-media'],
      logoName: "youtube.png",
      borderColor: "#FF0000",
      isFeatured: true,
      displayOrder: 1,
      seoTitle:
        "YouTube Premium 12M - Individual Own Account Upgrade | EaseSubs",
      seoDescription:
        "Get YouTube Premium 12M Individual Own Account Upgrade at discounted price.",
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Premium Individual",
          price: 29.99,
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
        "Stream millions of songs and podcasts ad-free with Spotify Premium.",
      categoryId: categoryMap['streaming-media'],
      logoName: "spotify.png",
      borderColor: "#1DB954",
      isFeatured: true,
      displayOrder: 2,
      seoTitle: "Spotify Premium Subscriptions | EaseSubs",
      seoDescription: "Get Spotify Premium subscriptions at discounted prices.",
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Individual",
          price: 24.99,
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
        "Watch thousands of movies and TV shows with unlimited streaming.",
      categoryId: categoryMap['streaming-media'],
      logoName: "netflix.png",
      borderColor: "#E50914",
      isFeatured: true,
      displayOrder: 3,
      seoTitle: "Netflix Subscriptions | EaseSubs",
      seoDescription: "Get Netflix subscriptions at discounted prices.",
      plans: [
        {
          name: "Basic 6 Month",
          planType: "Basic 6M",
          price: 29.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["720p HD", "1 Device", "Unlimited movies & shows"],
          isPopular: false,
        },
        {
          name: "Basic 12 Month",
          planType: "Basic",
          price: 55.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["720p HD", "1 Device", "Unlimited movies & shows"],
          isPopular: false,
        },
        {
          name: "Standard 6 Month",
          planType: "Standard 6M",
          price: 62.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["1080p Full HD", "2 Devices", "Unlimited movies & shows"],
          isPopular: true,
        },
        {
          name: "Standard 12 Month",
          planType: "Standard",
          price: 115.0,
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["1080p Full HD", "2 Devices", "Unlimited movies & shows"],
          isPopular: false,
        },
        {
          name: "Premium 6 Month",
          planType: "Premium 6M",
          price: 80.0,
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
        "Stream Disney, Pixar, Marvel, Star Wars, and National Geographic content.",
      categoryId: categoryMap['streaming-media'],
      logoName: "disney.png",
      borderColor: "#113CCF",
      isFeatured: false,
      displayOrder: 4,
      plans: [
        {
          name: "Individual 12 Month",
          planType: "Individual",
          price: 65.0,
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
      description: "Stream the largest collection of anime with Crunchyroll.",
      categoryId: categoryMap['streaming-media'],
      logoName: "crunchyroll.png",
      borderColor: "#FF6500",
      isFeatured: false,
      displayOrder: 5,
      plans: [
        {
          name: "Mega Fan 1 Month",
          planType: "Mega Fan",
          price: 4.0,
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
      description: "Enhanced Discord experience with Nitro features.",
      categoryId: categoryMap['social-communication'],
      logoName: "discord.png",
      borderColor: "#5865F2",
      isFeatured: true,
      displayOrder: 6,
      seoTitle: "Discord Nitro Subscriptions | EaseSubs",
      seoDescription: "Get Discord Nitro subscriptions at discounted prices.",
      plans: [
        {
          name: "Yearly Nitro Boost",
          planType: "Nitro Boost",
          price: 39.99,
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
          billingPeriod: BillingPeriod.MONTHLY,
          duration: 30,
          features: ["14 Server boosts", "Enhanced server features"],
          isPopular: false,
        },
        {
          name: "3 Month 14X Boost",
          planType: "Server Boost 3M",
          price: 19.99,
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
      description: "Premium Telegram features with enhanced functionality.",
      categoryId: categoryMap['social-communication'],
      logoName: "telegram.png",
      borderColor: "#0088CC",
      isFeatured: true,
      displayOrder: 7,
      seoTitle: "Telegram Premium Subscriptions | EaseSubs",
      seoDescription:
        "Get Telegram Premium subscriptions at discounted prices.",
      plans: [
        {
          name: "Gift Premium 12M",
          planType: "Gift Premium 12M",
          price: 33.99,
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
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 90,
          features: ["Premium features", "Enhanced limits"],
          isPopular: false,
        },
        {
          name: "Gift Membership 6 Month",
          planType: "Gift Membership 6M",
          price: 22.0,
          billingPeriod: BillingPeriod.CUSTOM,
          duration: 180,
          features: ["Premium features", "Enhanced limits"],
          isPopular: false,
        },
        {
          name: "Gift Membership 12 Month",
          planType: "Gift Membership",
          price: 35.0,
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
      categoryId: categoryMap['social-communication'],
      logoName: "twitter.png",
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
      categoryId: categoryMap['social-communication'],
      logoName: "tinder.png",
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
      description: "Learn languages with Duolingo Plus premium features.",
      categoryId: categoryMap['learning-education'],
      logoName: "duolingo.png",
      borderColor: "#58CC02",
      isFeatured: true,
      displayOrder: 10,
      seoTitle: "Duolingo Plus Subscriptions | EaseSubs",
      seoDescription: "Get Duolingo Plus subscriptions at discounted prices.",
      plans: [
        {
          name: "Plus 12M Individual Own Account Upgrade",
          planType: "Plus Individual",
          price: 34.99,
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
          billingPeriod: BillingPeriod.YEARLY,
          duration: 365,
          features: ["Ad-free learning", "Offline lessons", "Unlimited hearts"],
          isPopular: false,
        },
        {
          name: "Family 12 Month",
          planType: "Family",
          price: 40.0,
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
      description: "Learn languages with AI-powered lessons and feedback.",
      categoryId: categoryMap['learning-education'],
      logoName: "busuu.png",
      borderColor: "#1FB6E5",
      isFeatured: false,
      displayOrder: 11,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Individual Own",
          price: 27.99,
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
      categoryId: categoryMap['learning-education'],
      logoName: "rosettastone.png",
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
      categoryId: categoryMap['learning-education'],
      logoName: "sololearn.png",
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
      categoryId: categoryMap['learning-education'],
      logoName: "chess.png",
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
      categoryId: categoryMap['productivity-tools'],
      logoName: "linkedin.png",
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
      categoryId: categoryMap['productivity-tools'],
      logoName: "termius.png",
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
        "Professional design tools with premium templates and features.",
      categoryId: categoryMap['creative-design'],
      logoName: "canva.png",
      borderColor: "#00C4CC",
      isFeatured: true,
      displayOrder: 17,
      plans: [
        {
          name: "12M Individual Own Account Upgrade",
          planType: "Pro",
          price: 39.99,
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
      categoryId: categoryMap['creative-design'],
      logoName: "picsart.png",
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
      categoryId: categoryMap['creative-design'],
      logoName: "lightroom.png",
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
      categoryId: categoryMap['creative-design'],
      logoName: "capcut.png",
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
      categoryId: categoryMap['health-fitness'],
      logoName: "strava.png",
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
        logoName: productData.logoName,
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
        logoName: productData.logoName,
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

  console.log("âœ… Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("âŒ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
