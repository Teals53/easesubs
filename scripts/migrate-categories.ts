import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: 'Streaming & Media',
    slug: 'streaming-media',
    description: 'Entertainment, streaming services, and media platforms',
    color: '#EF4444',
    icon: 'Play',
    oldKey: 'STREAMING_MEDIA'
  },
  {
    name: 'Productivity & Tools',
    slug: 'productivity-tools',
    description: 'Productivity software, utilities, and business tools',
    color: '#3B82F6',
    icon: 'Zap',
    oldKey: 'PRODUCTIVITY_TOOLS'
  },
  {
    name: 'Creative & Design',
    slug: 'creative-design',
    description: 'Design software, creative tools, and artistic platforms',
    color: '#8B5CF6',
    icon: 'Palette',
    oldKey: 'CREATIVE_DESIGN'
  },
  {
    name: 'Learning & Education',
    slug: 'learning-education',
    description: 'Educational platforms, courses, and learning resources',
    color: '#10B981',
    icon: 'BookOpen',
    oldKey: 'LEARNING_EDUCATION'
  },
  {
    name: 'Social & Communication',
    slug: 'social-communication',
    description: 'Social networks, messaging, and communication tools',
    color: '#F59E0B',
    icon: 'MessageCircle',
    oldKey: 'SOCIAL_COMMUNICATION'
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming platforms, game stores, and gaming services',
    color: '#EC4899',
    icon: 'Gamepad2',
    oldKey: 'GAMING'
  },
  {
    name: 'Business & Finance',
    slug: 'business-finance',
    description: 'Business software, financial tools, and enterprise solutions',
    color: '#059669',
    icon: 'Building2',
    oldKey: 'BUSINESS_FINANCE'
  },
  {
    name: 'Health & Fitness',
    slug: 'health-fitness',
    description: 'Health apps, fitness platforms, and wellness services',
    color: '#DC2626',
    icon: 'Heart',
    oldKey: 'HEALTH_FITNESS'
  }
];

async function migrateCategories() {
  console.log('Starting category migration...');

  try {
    // Create new categories
    const createdCategories = [];
    for (const category of defaultCategories) {
      const { oldKey, ...categoryData } = category;
      const createdCategory = await prisma.category.create({
        data: {
          ...categoryData,
          displayOrder: defaultCategories.indexOf(category) + 1
        }
      });
      createdCategories.push({ ...createdCategory, oldKey });
      console.log(`✓ Created category: ${category.name}`);
    }

    // Note: The actual product migration will happen in the Prisma migration
    // This script is for setting up the initial category data

    console.log('\n✅ Category migration completed successfully!');
    console.log(`Created ${createdCategories.length} categories.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateCategories().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { migrateCategories, defaultCategories }; 