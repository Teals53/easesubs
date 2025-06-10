import { PrismaClient } from "@prisma/client";

interface Product {
  name: string;
  category: string;
}

interface OrderItem {
  plan: {
    product: Product;
  };
}

interface OrderWithItems {
  orderNumber: string;
  userId: string;
  items: OrderItem[];
}

export async function createAutoTicketForOrder(
  db: PrismaClient,
  order: OrderWithItems,
  tx?: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >, // Optional transaction context
  isAdminBypass = false, // Optional flag to indicate admin bypass orders
) {
  const dbContext = tx || db;

  const products = order.items.map((item) => item.plan.product);
  const productNames = products.map((p) => p.name).join(", ");

  // Generate ticket number
  const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // Create support ticket with appropriate tags
  const supportTicket = await dbContext.supportTicket.create({
    data: {
      ticketNumber,
      userId: order.userId,
      title: `Welcome to your new subscription${products.length > 1 ? "s" : ""}: ${productNames}${isAdminBypass ? " (Test Order)" : ""}`,
      description: `This ticket was automatically created for your order #${order.orderNumber}${isAdminBypass ? " (Admin Bypass - Test)" : ""}. You can use this ticket to get support for your new subscription${products.length > 1 ? "s" : ""}.`,
      status: "OPEN",
      priority: "MEDIUM",
      category: "ORDER_ISSUES",
      tags: [
        "auto-created",
        "new-order",
        ...(isAdminBypass
          ? ["admin-bypass", "test-order"]
          : ["payment-completed"]),
        ...products.map((p) => p.category.toLowerCase()),
      ],
    },
  });

  // Get product-specific auto messages
  const getProductWelcomeMessage = (product: Product) => {
    const category = product.category;
    const name = product.name;
    const testNote = isAdminBypass
      ? "\n\n🧪 **Note: This is a test order created via Admin Bypass for testing purposes.**"
      : "";

    switch (category) {
      case "STREAMING_MEDIA":
        return `🎬 Welcome to ${name}! Your subscription is now active. You can start streaming your favorite content right away. If you need help setting up your account or have any issues accessing the service, please let us know.${testNote}`;

      case "PRODUCTIVITY_TOOLS":
        return `💼 Welcome to ${name}! Your productivity subscription is ready to use. You can now access all premium features to boost your workflow. Need help getting started? We're here to assist you with setup and optimization tips.${testNote}`;

      case "CREATIVE_DESIGN":
        return `🎨 Welcome to ${name}! Your creative subscription is now active. Unleash your creativity with access to premium design tools and features. If you need guidance on using advanced features or have technical questions, feel free to ask.${testNote}`;

      case "LEARNING_EDUCATION":
        return `📚 Welcome to ${name}! Your learning subscription is ready. Start exploring courses and educational content to expand your knowledge. Need help navigating the platform or recommendations? We're here to help.${testNote}`;

      case "SOCIAL_COMMUNICATION":
        return `💬 Welcome to ${name}! Your communication subscription is active. Connect with others using premium features and enhanced functionality. Have questions about features or need setup assistance? Just ask!${testNote}`;

      case "GAMING":
        return `🎮 Welcome to ${name}! Your gaming subscription is ready to play. Access premium games, features, and content. Need help with installation, account setup, or have gaming-related questions? We've got you covered.${testNote}`;

      case "BUSINESS_FINANCE":
        return `💰 Welcome to ${name}! Your business subscription is now active. Manage your finances and business operations with professional tools. Need assistance with setup, integrations, or have questions about features? Contact us anytime.${testNote}`;

      case "HEALTH_FITNESS":
        return `💪 Welcome to ${name}! Your health & fitness subscription is ready. Start your wellness journey with access to premium content and features. Need workout recommendations, technical support, or guidance? We're here to help.${testNote}`;

      default:
        return `🎉 Welcome to ${name}! Your subscription is now active and ready to use. You now have access to all premium features and content. If you have any questions, need setup assistance, or require support, please don't hesitate to reach out.${testNote}`;
    }
  };

  // Create admin welcome message for each product
  for (const item of order.items) {
    const welcomeMessage = getProductWelcomeMessage(item.plan.product);

    await dbContext.supportTicketMessage.create({
      data: {
        ticketId: supportTicket.id,
        userId: order.userId, // Using order user as sender for now
        message: welcomeMessage,
        isInternal: false,
      },
    });
  }

  // If multiple products, add a general message
  if (products.length > 1) {
    const testNote = isAdminBypass
      ? "\n\n🧪 **Note: This is a test order created via Admin Bypass for testing purposes.**"
      : "";
    await dbContext.supportTicketMessage.create({
      data: {
        ticketId: supportTicket.id,
        userId: order.userId, // Using order user as sender for now
        message: `🌟 Thank you for your multiple subscription purchase! This ticket covers support for all your new services: ${productNames}. We're committed to ensuring you get the most out of each subscription. Feel free to ask any questions about any of your services.${testNote}`,
        isInternal: false,
      },
    });
  }

  return supportTicket;
}

