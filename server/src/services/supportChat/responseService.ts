import { ChatIntent, IChatResponse, IQuickAction } from '../../types/supportChat';
import { logger } from '../../utils/logger';

/**
 * Format order information for response
 */
const formatOrderInfo = (order: any): string => {
  if (!order) {
    return 'Order not found.';
  }

  const itemsList = order.items
    .map((item: any) => `  • ${item.name} (Qty: ${item.quantity}) - ₹${item.total}`)
    .join('\n');

  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    processing: '🔄',
    shipped: '🚚',
    delivered: '✓',
    cancelled: '❌',
  };

  return `Order #${order.orderNumber}
Status: ${statusEmoji[order.status] || ''} ${order.status.toUpperCase()}
Payment: ${order.paymentStatus.toUpperCase()}
Total: ₹${order.totalAmount}

Items:
${itemsList}

${order.tracking ? `Tracking: ${order.tracking.trackingNumber}\nCarrier: ${order.tracking.carrier}` : ''}
${order.shippingAddress ? `Shipping to: ${order.shippingAddress.street}, ${order.shippingAddress.city}` : ''}`;
};

/**
 * Format product information for response
 */
const formatProductInfo = (product: any): string => {
  if (!product) {
    return 'Product not found.';
  }

  const stockStatus = product.stock > 0 ? `✅ In Stock (${product.stock} available)` : '❌ Out of Stock';

  return `${product.name}
Brand: ${product.brand}
Price: ₹${product.price}
Stock: ${stockStatus}
${product.description ? `\nDescription: ${product.description}` : ''}
${product.specifications ? `\nSpecifications: ${JSON.stringify(product.specifications, null, 2)}` : ''}`;
};

/**
 * Format account information for response
 */
const formatAccountInfo = (profile: any): string => {
  if (!profile) {
    return 'Profile not found.';
  }

  return `Your Profile:
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone}
Role: ${profile.role?.join(', ') || 'user'}`;
};

/**
 * Generate response based on intent and context
 */
export const generateResponse = (
  intent: ChatIntent,
  entities: Record<string, any>,
  context: any,
): IChatResponse => {
  try {
    switch (intent) {
      case 'ORDER_TRACKING':
      case 'ORDER_STATUS': {
        const orderNumber = entities.orderNumber;
        if (!orderNumber && context.recentOrders && context.recentOrders.length > 0) {
          // Show recent orders if no specific order number
          const ordersList = context.recentOrders
            .slice(0, 3)
            .map(
              (order: any) =>
                `  • Order #${order.orderNumber} - ${order.status.toUpperCase()} - ₹${order.totalAmount}`,
            )
            .join('\n');

          return {
            text: `Here are your recent orders:\n\n${ordersList}\n\nPlease provide an order number to get detailed tracking information.`,
            intent,
            quickActions: [
              {
                id: 'track_order',
                label: 'Track Order',
                actionType: 'TRACK_ORDER',
              },
            ],
          };
        }

        if (orderNumber && context.orderDetails) {
          return {
            text: formatOrderInfo(context.orderDetails),
            intent,
            navigation: {
              screen: 'OrderTracking',
              params: { orderId: context.orderDetails.id },
            },
          };
        }

        return {
          text: orderNumber
            ? `I couldn't find order #${orderNumber}. Please check the order number and try again.`
            : 'Please provide an order number to track your order. For example: "Track order #12345"',
          intent,
        };
      }

      case 'ORDER_HISTORY': {
        if (context.recentOrders && context.recentOrders.length > 0) {
          const ordersList = context.recentOrders
            .map(
              (order: any) =>
                `  • Order #${order.orderNumber} - ${order.status.toUpperCase()} - ₹${order.totalAmount} - ${new Date(order.createdAt).toLocaleDateString()}`,
            )
            .join('\n');

          return {
            text: `Your Recent Orders:\n\n${ordersList}\n\nYou can track any order by providing the order number.`,
            intent,
            quickActions: [
              {
                id: 'track_order',
                label: 'Track Order',
                actionType: 'TRACK_ORDER',
              },
            ],
          };
        }

        return {
          text: "You don't have any orders yet. Start shopping to place your first order!",
          intent,
        };
      }

      case 'ORDER_CANCELLATION': {
        const orderNumber = entities.orderNumber;
        if (orderNumber && context.orderDetails) {
          const canCancel = ['pending', 'confirmed'].includes(context.orderDetails.status);
          return {
            text: canCancel
              ? `Order #${orderNumber} can be cancelled. Would you like to proceed with cancellation?`
              : `Order #${orderNumber} cannot be cancelled as it's already ${context.orderDetails.status}.`,
            intent,
            data: {
              canCancel,
              orderId: context.orderDetails.id,
            },
          };
        }

        return {
          text: 'Please provide an order number to cancel. For example: "Cancel order #12345"',
          intent,
        };
      }

      case 'ORDER_RETURN': {
        const orderNumber = entities.orderNumber;
        if (orderNumber && context.orderDetails) {
          const canReturn = ['delivered'].includes(context.orderDetails.status);
          return {
            text: canReturn
              ? `Order #${orderNumber} is eligible for return/refund. Would you like to initiate a return?`
              : `Order #${orderNumber} is not eligible for return. Only delivered orders can be returned.`,
            intent,
            data: {
              canReturn,
              orderId: context.orderDetails.id,
            },
            quickActions: canReturn
              ? [
                  {
                    id: 'return_refund',
                    label: 'Return/Refund',
                    actionType: 'RETURN_REFUND',
                    metadata: { orderId: context.orderDetails.id },
                  },
                ]
              : undefined,
          };
        }

        return {
          text: 'Please provide an order number for return/refund. For example: "Return order #12345"',
          intent,
        };
      }

      case 'PRODUCT_SEARCH': {
        const productName = entities.productName;
        if (context.products && context.products.length > 0) {
          const productsList = context.products
            .slice(0, 5)
            .map((product: any) => `  • ${product.name} - ₹${product.price} ${product.stock > 0 ? '(In Stock)' : '(Out of Stock)'}`)
            .join('\n');

          return {
            text: `Found ${context.products.length} product(s):\n\n${productsList}\n\nWould you like more details about any product?`,
            intent,
            data: {
              products: context.products,
            },
            quickActions: [
              {
                id: 'product_search',
                label: 'View Products',
                actionType: 'PRODUCT_SEARCH',
              },
            ],
          };
        }

        return {
          text: productName
            ? `No products found matching "${productName}". Try searching with different keywords.`
            : 'What product are you looking for? For example: "Find car accessories" or "Search for bike parts"',
          intent,
        };
      }

      case 'PRODUCT_SPECS':
      case 'PRODUCT_AVAILABILITY':
      case 'PRODUCT_PRICE': {
        if (context.product) {
          return {
            text: formatProductInfo(context.product),
            intent,
            navigation: {
              screen: 'ProductDetail',
              params: { productId: context.product.id },
            },
          };
        }

        return {
          text: 'Please specify which product you want information about. For example: "Tell me about product X"',
          intent,
        };
      }

      case 'PRODUCT_RECOMMENDATION': {
        if (context.products && context.products.length > 0) {
          const recommendations = context.products
            .slice(0, 3)
            .map((product: any) => `  • ${product.name} - ₹${product.price}`)
            .join('\n');

          return {
            text: `Here are some recommended products for you:\n\n${recommendations}\n\nWould you like to see more details?`,
            intent,
            data: {
              products: context.products,
            },
          };
        }

        return {
          text: 'I can help you find products. What type of products are you looking for?',
          intent,
        };
      }

      case 'ACCOUNT_PROFILE': {
        if (context.profile) {
          return {
            text: formatAccountInfo(context.profile),
            intent,
            navigation: {
              screen: 'EditProfile',
            },
          };
        }

        return {
          text: 'Unable to fetch profile information. Please try again later.',
          intent,
        };
      }

      case 'ACCOUNT_SETTINGS': {
        return {
          text: 'You can update your account settings from the Profile screen. Would you like to go there?',
          intent,
          navigation: {
            screen: 'AccountCenter',
          },
        };
      }

      case 'PAYMENT_INFO': {
        return {
          text: 'You can manage your payment methods from the Account Center. Would you like to go there?',
          intent,
          navigation: {
            screen: 'AccountCenter',
          },
        };
      }

      case 'CART_STATUS': {
        if (context.cartItems && context.cartItems.length > 0) {
          const total = context.cartItems.reduce((sum: number, item: any) => sum + item.total, 0);
          const itemsList = context.cartItems
            .map((item: any) => `  • ${item.name} x${item.quantity} - ₹${item.total}`)
            .join('\n');

          return {
            text: `Your Cart (${context.cartItems.length} items):\n\n${itemsList}\n\nTotal: ₹${total}`,
            intent,
            navigation: {
              screen: 'Cart',
            },
          };
        }

        return {
          text: 'Your cart is empty. Start adding products to your cart!',
          intent,
        };
      }

      case 'WISHLIST': {
        if (context.wishlistItems && context.wishlistItems.length > 0) {
          return {
            text: `You have ${context.wishlistItems.length} item(s) in your wishlist. Would you like to view them?`,
            intent,
            navigation: {
              screen: 'Wishlist',
            },
          };
        }

        return {
          text: 'Your wishlist is empty. Save products you like to your wishlist!',
          intent,
        };
      }

      case 'DEALER_ORDERS': {
        if (context.dealerOrders && context.dealerOrders.length > 0) {
          const ordersList = context.dealerOrders
            .map(
              (order: any) =>
                `  • Order #${order.orderNumber} - ${order.status.toUpperCase()} - ₹${order.totalAmount}`,
            )
            .join('\n');

          return {
            text: `Your Orders (${context.dealerOrders.length}):\n\n${ordersList}`,
            intent,
          };
        }

        return {
          text: "You don't have any orders yet.",
          intent,
        };
      }

      case 'DEALER_PRODUCTS': {
        if (context.dealerProducts && context.dealerProducts.length > 0) {
          const productsList = context.dealerProducts
            .map((product: any) => `  • ${product.name} - ₹${product.price} (Stock: ${product.stock})`)
            .join('\n');

          return {
            text: `Your Products (${context.dealerProducts.length}):\n\n${productsList}`,
            intent,
          };
        }

        return {
          text: "You don't have any products yet. Add products to your inventory!",
          intent,
        };
      }

      case 'DEALER_INVENTORY': {
        if (context.dealerProducts) {
          const lowStock = context.dealerProducts.filter((p: any) => p.stock < 10);
          if (lowStock.length > 0) {
            const lowStockList = lowStock.map((p: any) => `  • ${p.name} - Only ${p.stock} left`).join('\n');
            return {
              text: `Low Stock Alert:\n\n${lowStockList}\n\nConsider restocking these items.`,
              intent,
            };
          }

          return {
            text: 'All your products have sufficient stock.',
            intent,
          };
        }

        return {
          text: 'Unable to fetch inventory information.',
          intent,
        };
      }

      case 'GENERAL_HELP': {
        return {
          text: `I'm here to help! I can assist you with:
• Order tracking and status
• Product search and information
• Account and profile management
• Cart and wishlist
• Returns and refunds

What would you like help with?`,
          intent,
          quickActions: [
            {
              id: 'track_order',
              label: 'Track Order',
              actionType: 'TRACK_ORDER',
            },
            {
              id: 'product_search',
              label: 'Search Products',
              actionType: 'PRODUCT_SEARCH',
            },
            {
              id: 'account_help',
              label: 'Account Help',
              actionType: 'ACCOUNT_HELP',
            },
          ],
        };
      }

      default:
        return {
          text: "I'm not sure I understand. Could you please rephrase your question? I can help with orders, products, account, and more.",
          intent: 'UNKNOWN',
          quickActions: [
            {
              id: 'general_help',
              label: 'Get Help',
              actionType: 'ACCOUNT_HELP',
            },
          ],
        };
    }
  } catch (error) {
    logger.error('Error generating response:', error);
    return {
      text: 'Sorry, I encountered an error. Please try again later.',
      intent: 'UNKNOWN',
    };
  }
};

