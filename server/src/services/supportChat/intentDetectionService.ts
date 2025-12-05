import { ChatIntent, IChatIntent } from '../../types/supportChat';

interface IIntentPattern {
  intent: ChatIntent;
  keywords: string[];
  patterns: RegExp[];
  entityExtractors?: {
    orderNumber?: RegExp;
    productName?: RegExp;
  };
}

const intentPatterns: IIntentPattern[] = [
  // Order tracking
  {
    intent: 'ORDER_TRACKING',
    keywords: ['track', 'where is', 'order status', 'tracking', 'delivery status', 'where is my order'],
    patterns: [/track\s+(?:order|my order)/i, /where\s+is\s+(?:my\s+)?order/i, /order\s+status/i],
    entityExtractors: {
      orderNumber: /(?:order|#)\s*([A-Z0-9-]+)/i,
    },
  },
  // Order status
  {
    intent: 'ORDER_STATUS',
    keywords: ['order status', 'order details', 'show order', 'order info'],
    patterns: [/order\s+(?:status|details|info)/i, /show\s+order/i],
    entityExtractors: {
      orderNumber: /(?:order|#)\s*([A-Z0-9-]+)/i,
    },
  },
  // Order cancellation
  {
    intent: 'ORDER_CANCELLATION',
    keywords: ['cancel order', 'cancel my order', 'want to cancel'],
    patterns: [/cancel\s+(?:my\s+)?order/i, /want\s+to\s+cancel/i],
    entityExtractors: {
      orderNumber: /(?:order|#)\s*([A-Z0-9-]+)/i,
    },
  },
  // Order return
  {
    intent: 'ORDER_RETURN',
    keywords: ['return', 'refund', 'return order', 'get refund', 'return policy'],
    patterns: [/return\s+(?:order|my order)?/i, /(?:want|need|get)\s+refund/i, /return\s+policy/i],
    entityExtractors: {
      orderNumber: /(?:order|#)\s*([A-Z0-9-]+)/i,
    },
  },
  // Order history
  {
    intent: 'ORDER_HISTORY',
    keywords: ['order history', 'my orders', 'recent orders', 'all orders', 'show orders'],
    patterns: [/order\s+history/i, /(?:my|recent|all)\s+orders/i, /show\s+orders/i],
  },
  // Product search
  {
    intent: 'PRODUCT_SEARCH',
    keywords: ['find product', 'search', 'search for', 'find', 'show products', 'products'],
    patterns: [/find\s+product/i, /search\s+(?:for\s+)?/i, /show\s+products/i],
    entityExtractors: {
      productName: /(?:find|search|for)\s+(.+)/i,
    },
  },
  // Product specs
  {
    intent: 'PRODUCT_SPECS',
    keywords: ['specs', 'specifications', 'product details', 'tell me about', 'product info'],
    patterns: [/specs?/i, /specifications?/i, /tell\s+me\s+about/i, /product\s+(?:details|info)/i],
    entityExtractors: {
      productName: /(?:about|product)\s+(.+)/i,
    },
  },
  // Product availability
  {
    intent: 'PRODUCT_AVAILABILITY',
    keywords: ['available', 'in stock', 'stock', 'availability', 'check stock'],
    patterns: [/available/i, /in\s+stock/i, /stock\s+(?:status|level)?/i, /check\s+stock/i],
    entityExtractors: {
      productName: /(?:for|product)\s+(.+)/i,
    },
  },
  // Product recommendation
  {
    intent: 'PRODUCT_RECOMMENDATION',
    keywords: ['recommend', 'suggest', 'recommendation', 'suggestion', 'what products'],
    patterns: [/recommend/i, /suggest/i, /what\s+products/i],
  },
  // Product price
  {
    intent: 'PRODUCT_PRICE',
    keywords: ['price', 'cost', 'how much', 'product price'],
    patterns: [/price/i, /cost/i, /how\s+much/i],
    entityExtractors: {
      productName: /(?:of|for)\s+(.+)/i,
    },
  },
  // Account profile
  {
    intent: 'ACCOUNT_PROFILE',
    keywords: ['profile', 'my profile', 'account details', 'who am i', 'my account'],
    patterns: [/profile/i, /account\s+details/i, /who\s+am\s+i/i, /my\s+account/i],
  },
  // Account settings
  {
    intent: 'ACCOUNT_SETTINGS',
    keywords: ['settings', 'account settings', 'privacy settings', 'app settings'],
    patterns: [/settings/i, /account\s+settings/i, /privacy\s+settings/i],
  },
  // Payment info
  {
    intent: 'PAYMENT_INFO',
    keywords: ['payment', 'payment methods', 'payment options', 'add payment'],
    patterns: [/payment\s+(?:methods?|options?)?/i, /add\s+payment/i],
  },
  // Cart status
  {
    intent: 'CART_STATUS',
    keywords: ['cart', 'my cart', 'cart items', 'cart total', 'items in cart'],
    patterns: [/cart/i, /items\s+in\s+cart/i, /cart\s+total/i],
  },
  // Wishlist
  {
    intent: 'WISHLIST',
    keywords: ['wishlist', 'saved', 'my wishlist', 'wishlist items'],
    patterns: [/wishlist/i, /saved\s+items?/i, /my\s+wishlist/i],
  },
  // Dealer orders
  {
    intent: 'DEALER_ORDERS',
    keywords: ['my orders', 'dealer orders', 'pending orders', 'show orders'],
    patterns: [/my\s+orders/i, /dealer\s+orders/i, /pending\s+orders/i],
  },
  // Dealer order update
  {
    intent: 'DEALER_ORDER_UPDATE',
    keywords: ['update order', 'mark as shipped', 'order status update'],
    patterns: [/update\s+order/i, /mark\s+as\s+shipped/i, /order\s+status\s+update/i],
    entityExtractors: {
      orderNumber: /(?:order|#)\s*([A-Z0-9-]+)/i,
    },
  },
  // Dealer products
  {
    intent: 'DEALER_PRODUCTS',
    keywords: ['my products', 'product list', 'inventory products'],
    patterns: [/my\s+products/i, /product\s+list/i, /inventory\s+products/i],
  },
  // Dealer inventory
  {
    intent: 'DEALER_INVENTORY',
    keywords: ['inventory', 'stock', 'low stock', 'stock levels'],
    patterns: [/inventory/i, /low\s+stock/i, /stock\s+levels?/i],
  },
  // Dealer analytics
  {
    intent: 'DEALER_ANALYTICS',
    keywords: ['analytics', 'sales', 'sales report', 'sales stats', 'revenue'],
    patterns: [/analytics/i, /sales\s+(?:report|stats)?/i, /revenue/i],
  },
  // Dealer business
  {
    intent: 'DEALER_BUSINESS',
    keywords: ['business', 'business details', 'registration', 'business info'],
    patterns: [/business\s+(?:details|info)?/i, /registration/i],
  },
  // Dealer earnings
  {
    intent: 'DEALER_EARNINGS',
    keywords: ['earnings', 'payment history', 'my earnings', 'payout'],
    patterns: [/earnings/i, /payment\s+history/i, /my\s+earnings/i, /payout/i],
  },
  // General help
  {
    intent: 'GENERAL_HELP',
    keywords: ['help', 'how to', 'faq', 'support', 'guide', 'how do i'],
    patterns: [/help/i, /how\s+to/i, /faq/i, /support/i, /guide/i, /how\s+do\s+i/i],
  },
];

/**
 * Detect intent from user message
 */
export const detectIntent = (message: string): IChatIntent => {
  const normalizedMessage = message.toLowerCase().trim();

  let bestMatch: IChatIntent | null = null;
  let highestConfidence = 0;

  for (const pattern of intentPatterns) {
    let confidence = 0;

    // Check keywords
    const keywordMatches = pattern.keywords.filter((keyword) =>
      normalizedMessage.includes(keyword.toLowerCase()),
    ).length;
    confidence += keywordMatches * 0.3;

    // Check regex patterns
    const patternMatches = pattern.patterns.filter((regex) => regex.test(message)).length;
    confidence += patternMatches * 0.7;

    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestMatch = {
        intent: pattern.intent,
        confidence: Math.min(confidence, 1),
        entities: extractEntities(message, pattern),
      };
    }
  }

  if (!bestMatch || highestConfidence < 0.3) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      entities: {},
    };
  }

  return bestMatch;
};

/**
 * Extract entities from message based on intent
 */
export const extractEntities = (message: string, pattern: IIntentPattern): Record<string, any> => {
  const entities: Record<string, any> = {};

  if (pattern.entityExtractors) {
    // Extract order number
    if (pattern.entityExtractors.orderNumber) {
      const orderMatch = message.match(pattern.entityExtractors.orderNumber);
      if (orderMatch && orderMatch[1]) {
        entities.orderNumber = orderMatch[1].trim();
      }
    }

    // Extract product name
    if (pattern.entityExtractors.productName) {
      const productMatch = message.match(pattern.entityExtractors.productName);
      if (productMatch && productMatch[1]) {
        entities.productName = productMatch[1].trim();
      }
    }
  }

  return entities;
};

