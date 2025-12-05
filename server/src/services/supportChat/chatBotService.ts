import { SupportChat } from '../../models/SupportChat';
import { ChatIntent, IChatResponse, IQuickAction, IProcessMessageRequest, IProcessMessageResponse } from '../../types/supportChat';
import { detectIntent } from './intentDetectionService';
import { getUserContext, getOrderDetails, searchProducts, getProductById, getUserProfile, getDealerOrders, getDealerProducts } from './contextService';
import { generateResponse } from './responseService';
import { logger } from '../../utils/logger';

/**
 * Generate session ID for chat
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Get or create chat session
 */
const getOrCreateSession = async (userId: string, sessionId?: string) => {
  if (sessionId) {
    const existingSession = await SupportChat.findOne({ userId, sessionId });
    if (existingSession) {
      return existingSession;
    }
  }

  const newSessionId = sessionId || generateSessionId();
  const newSession = new SupportChat({
    userId,
    sessionId: newSessionId,
    messages: [],
  });

  await newSession.save();
  return newSession;
};

/**
 * Process user message and generate bot response
 */
export const processMessage = async (
  userId: string,
  request: IProcessMessageRequest,
): Promise<IProcessMessageResponse> => {
  try {
    const { message, sessionId } = request;

    // Get or create session
    const session = await getOrCreateSession(userId, sessionId);
    const currentSessionId = session.sessionId;

    // Save user message
    session.messages.push({
      role: 'user',
      text: message,
      timestamp: new Date(),
    });

    // Detect intent
    const intentResult = detectIntent(message);

    // Get user context
    const userContext = await getUserContext(userId);
    const context: any = {
      ...userContext,
    };

    // Fetch additional context based on intent
    if (intentResult.entities.orderNumber) {
      const orderDetails = await getOrderDetails(intentResult.entities.orderNumber, userId);
      context.orderDetails = orderDetails;
    }

    if (intentResult.entities.productName) {
      const products = await searchProducts(intentResult.entities.productName, userId, 5);
      context.products = products;
      if (products.length > 0) {
        context.product = products[0];
      }
    }

    // Handle specific intents that need additional data
    if (intentResult.intent === 'PRODUCT_SEARCH' && !intentResult.entities.productName) {
      // If no product name, show some products
      const products = await searchProducts('', userId, 5);
      context.products = products;
    }

    if (intentResult.intent === 'PRODUCT_RECOMMENDATION') {
      const products = await searchProducts('', userId, 5);
      context.products = products;
    }

    if (intentResult.intent === 'ACCOUNT_PROFILE') {
      const profile = await getUserProfile(userId);
      context.profile = profile;
    }

    // Check if user is dealer and fetch dealer-specific data
    if (userContext.role.includes('dealer')) {
      if (intentResult.intent === 'DEALER_ORDERS') {
        const dealerOrders = await getDealerOrders(userId, 10);
        context.dealerOrders = dealerOrders;
      }

      if (intentResult.intent === 'DEALER_PRODUCTS' || intentResult.intent === 'DEALER_INVENTORY') {
        const dealerProducts = await getDealerProducts(userId, 20);
        context.dealerProducts = dealerProducts;
      }
    }

    // Generate response
    const response = generateResponse(intentResult.intent, intentResult.entities, context);

    // Save bot response
    session.messages.push({
      role: 'bot',
      text: response.text,
      timestamp: new Date(),
      intent: intentResult.intent,
      metadata: {
        quickActions: response.quickActions,
        navigation: response.navigation,
        data: response.data,
      },
    });

    await session.save();

    return {
      response,
      sessionId: currentSessionId,
    };
  } catch (error) {
    logger.error('Error processing message:', error);
    throw error;
  }
};

/**
 * Get quick actions based on user role and context
 */
export const getQuickActions = async (userId: string): Promise<IQuickAction[]> => {
  try {
    const userContext = await getUserContext(userId);
    const isDealer = userContext.role.includes('dealer');

    const quickActions: IQuickAction[] = [];

    if (isDealer) {
      quickActions.push(
        {
          id: 'dealer_orders',
          label: 'My Orders',
          actionType: 'DEALER_ORDERS',
        },
        {
          id: 'dealer_products',
          label: 'My Products',
          actionType: 'DEALER_PRODUCTS',
        },
      );
    } else {
      quickActions.push(
        {
          id: 'track_order',
          label: 'Track Order',
          actionType: 'TRACK_ORDER',
        },
        {
          id: 'return_refund',
          label: 'Return/Refund',
          actionType: 'RETURN_REFUND',
        },
        {
          id: 'product_search',
          label: 'Product Search',
          actionType: 'PRODUCT_SEARCH',
        },
        {
          id: 'account_help',
          label: 'Account Help',
          actionType: 'ACCOUNT_HELP',
        },
      );
    }

    return quickActions;
  } catch (error) {
    logger.error('Error getting quick actions:', error);
    return [];
  }
};

/**
 * Handle quick action
 */
export const handleQuickAction = async (
  userId: string,
  actionType: string,
  actionData?: Record<string, any>,
): Promise<IChatResponse> => {
  try {
    const userContext = await getUserContext(userId);

    switch (actionType) {
      case 'TRACK_ORDER': {
        if (actionData?.orderId || actionData?.orderNumber) {
          const orderDetails = await getOrderDetails(
            actionData.orderId || actionData.orderNumber,
            userId,
          );
          if (orderDetails) {
            return {
              text: `Order #${orderDetails.orderNumber}\nStatus: ${orderDetails.status.toUpperCase()}\nTotal: ₹${orderDetails.totalAmount}\n\nWould you like to see full tracking details?`,
              navigation: {
                screen: 'OrderTracking',
                params: { orderId: orderDetails.id },
              },
            };
          }
        }

        // Show recent orders
        if (userContext.recentOrders && userContext.recentOrders.length > 0) {
          const ordersList = userContext.recentOrders
            .slice(0, 3)
            .map(
              (order: any) =>
                `  • Order #${order.orderNumber} - ${order.status.toUpperCase()} - ₹${order.totalAmount}`,
            )
            .join('\n');

          return {
            text: `Your Recent Orders:\n\n${ordersList}\n\nPlease provide an order number to track.`,
          };
        }

        return {
          text: "You don't have any orders yet.",
        };
      }

      case 'RETURN_REFUND': {
        if (userContext.recentOrders && userContext.recentOrders.length > 0) {
          const eligibleOrders = userContext.recentOrders.filter(
            (order: any) => order.status === 'delivered',
          );

          if (eligibleOrders.length > 0) {
            const ordersList = eligibleOrders
              .map((order: any) => `  • Order #${order.orderNumber} - ₹${order.totalAmount}`)
              .join('\n');

            return {
              text: `Orders Eligible for Return:\n\n${ordersList}\n\nPlease provide an order number to initiate return.`,
            };
          }

          return {
            text: 'No orders are currently eligible for return. Only delivered orders can be returned.',
          };
        }

        return {
          text: "You don't have any orders yet.",
        };
      }

      case 'PRODUCT_SEARCH': {
        const products = await searchProducts('', userId, 5);
        if (products.length > 0) {
          const productsList = products
            .slice(0, 5)
            .map((product: any) => `  • ${product.name} - ₹${product.price}`)
            .join('\n');

          return {
            text: `Popular Products:\n\n${productsList}\n\nWhat product are you looking for?`,
            navigation: {
              screen: 'Marketplace',
            },
          };
        }

        return {
          text: 'No products available at the moment.',
        };
      }

      case 'ACCOUNT_HELP': {
        const profile = await getUserProfile(userId);
        if (profile) {
          return {
            text: `Your Account:\n\nName: ${profile.name}\nEmail: ${profile.email}\nPhone: ${profile.phone}\n\nWould you like to update your profile?`,
            navigation: {
              screen: 'EditProfile',
            },
          };
        }

        return {
          text: 'Unable to fetch account information.',
        };
      }

      case 'DEALER_ORDERS': {
        const dealerOrders = await getDealerOrders(userId, 10);
        if (dealerOrders.length > 0) {
          const ordersList = dealerOrders
            .map(
              (order: any) =>
                `  • Order #${order.orderNumber} - ${order.status.toUpperCase()} - ₹${order.totalAmount}`,
            )
            .join('\n');

          return {
            text: `Your Orders (${dealerOrders.length}):\n\n${ordersList}`,
          };
        }

        return {
          text: "You don't have any orders yet.",
        };
      }

      case 'DEALER_PRODUCTS': {
        const dealerProducts = await getDealerProducts(userId, 10);
        if (dealerProducts.length > 0) {
          const productsList = dealerProducts
            .map((product: any) => `  • ${product.name} - ₹${product.price} (Stock: ${product.stock})`)
            .join('\n');

          return {
            text: `Your Products (${dealerProducts.length}):\n\n${productsList}`,
          };
        }

        return {
          text: "You don't have any products yet. Add products to your inventory!",
        };
      }

      default:
        return {
          text: 'Action not recognized. Please try again.',
        };
    }
  } catch (error) {
    logger.error('Error handling quick action:', error);
    return {
      text: 'Sorry, I encountered an error. Please try again later.',
    };
  }
};

/**
 * Get chat history
 */
export const getChatHistory = async (userId: string, sessionId?: string) => {
  try {
    if (sessionId) {
      const session = await SupportChat.findOne({ userId, sessionId });
      return session ? session.messages : [];
    }

    // Get most recent session
    const session = await SupportChat.findOne({ userId }).sort({ updatedAt: -1 });
    return session ? session.messages : [];
  } catch (error) {
    logger.error('Error getting chat history:', error);
    return [];
  }
};

/**
 * Clear chat history
 */
export const clearChatHistory = async (userId: string, sessionId?: string) => {
  try {
    if (sessionId) {
      await SupportChat.deleteOne({ userId, sessionId });
    } else {
      await SupportChat.deleteMany({ userId });
    }
  } catch (error) {
    logger.error('Error clearing chat history:', error);
    throw error;
  }
};

