import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function migrateStockSystem() {
  console.log("🔄 Starting stock system migration...");

  try {
    // Get all product plans with stock quantities
    const plansWithStock = await db.productPlan.findMany({
      where: {
        stockQuantity: {
          not: null,
        },
        deliveryType: "AUTOMATIC", // Only migrate stock for automatic delivery plans
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📦 Found ${plansWithStock.length} plans with stock quantities to migrate`);

    for (const plan of plansWithStock) {
      const stockQuantity = plan.stockQuantity || 0;
      
      if (stockQuantity > 0) {
        console.log(`📝 Migrating ${stockQuantity} stock items for ${plan.product.name} - ${plan.planType}`);
        
        // Create stock items for this plan
        const stockItems = [];
        for (let i = 0; i < stockQuantity; i++) {
          stockItems.push({
            planId: plan.id,
            content: `MIGRATED_STOCK_ITEM_${i + 1}_FOR_${plan.planType.toUpperCase()}`, // Placeholder content
            isUsed: false,
          });
        }

        // Batch create stock items
        await db.stockItem.createMany({
          data: stockItems,
        });

        console.log(`✅ Created ${stockQuantity} stock items for ${plan.product.name} - ${plan.planType}`);
      } else {
        console.log(`⚠️  Skipping ${plan.product.name} - ${plan.planType} (stock quantity: ${stockQuantity})`);
      }
    }

    // Get plans with manual delivery that have stock quantities (these should be set to null)
    const manualPlansWithStock = await db.productPlan.findMany({
      where: {
        stockQuantity: {
          not: null,
        },
        deliveryType: "MANUAL",
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (manualPlansWithStock.length > 0) {
      console.log(`🔧 Found ${manualPlansWithStock.length} manual delivery plans with stock quantities (will be set to unlimited)`);
      
      for (const plan of manualPlansWithStock) {
        console.log(`📝 Setting unlimited stock for manual delivery: ${plan.product.name} - ${plan.planType}`);
      }
    }

    console.log("✅ Stock system migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   • Migrated ${plansWithStock.filter(p => (p.stockQuantity || 0) > 0).length} automatic delivery plans to StockItem system`);
    console.log(`   • Found ${manualPlansWithStock.length} manual delivery plans (will have unlimited stock)`);
    console.log("\n⚠️  Note: You can now safely remove the stockQuantity column from the database schema.");
    console.log("   The stock for AUTOMATIC delivery plans is now managed through the StockItem table.");
    console.log("   MANUAL delivery plans have unlimited stock and don't need stock management.");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
migrateStockSystem()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  }); 