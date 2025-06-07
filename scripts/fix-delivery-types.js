import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function fixDeliveryTypes() {
  console.log('🔧 Fixing delivery types for existing order items...');

  try {
    // Get all order items with their plans
    const orderItems = await db.orderItem.findMany({
      include: {
        plan: {
          select: {
            id: true,
            deliveryType: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${orderItems.length} order items to check`);

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const item of orderItems) {
      if (item.deliveryType !== item.plan.deliveryType) {
        // Update the delivery type to match the plan
        await db.orderItem.update({
          where: { id: item.id },
          data: { deliveryType: item.plan.deliveryType },
        });

        console.log(`✅ Fixed order item ${item.id} (${item.plan.product.name}): ${item.deliveryType} → ${item.plan.deliveryType}`);
        fixed++;
      } else {
        alreadyCorrect++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Fixed: ${fixed} order items`);
    console.log(`   - Already correct: ${alreadyCorrect} order items`);
    console.log(`   - Total processed: ${orderItems.length} order items`);

    // Now process any completed orders that need delivery processing
    const completedOrders = await db.order.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            plan: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    console.log(`\n🚀 Processing deliveries for ${completedOrders.length} completed orders...`);

    let deliveriesProcessed = 0;

    for (const order of completedOrders) {
      for (const item of order.items) {
        // Check if delivery has already been processed
        if (!item.deliveredAt && !item.ticketId && !item.stockItemId) {
          try {
                         // Dynamically import the delivery service
             const { DeliveryService } = await import('../src/lib/delivery-service.ts');
            
            const deliveryResult = await DeliveryService.processDelivery({
              orderId: order.id,
              orderItemId: item.id,
            });

            console.log(`✅ Processed delivery for order ${order.orderNumber}, item ${item.id}: ${deliveryResult.type}`);
            deliveriesProcessed++;
          } catch (error) {
            console.error(`❌ Failed to process delivery for order ${order.orderNumber}, item ${item.id}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🎉 Delivery processing complete! Processed ${deliveriesProcessed} deliveries.`);

  } catch (error) {
    console.error('❌ Error fixing delivery types:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
fixDeliveryTypes(); 