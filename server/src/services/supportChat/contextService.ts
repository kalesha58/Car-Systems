import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { SignUp } from '../../models/SignUp';
import { IUserContext } from '../../types/supportChat';
import { logger } from '../../utils/logger';
import { getAllProductsForUsers } from '../user/productService';

/**
 * Get user context including orders, profile, etc.
 */
export const getUserContext = async (userId: string): Promise<IUserContext> => {
  try {
    const user = await SignUp.findById(userId).select('name email phone role profileImage');

    if (!user) {
      throw new Error('User not found');
    }

    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const ordersData = recentOrders.map((order) => ({
      id: (order._id as any).toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items,
      createdAt: order.createdAt,
    }));

    return {
      userId,
      role: user.role || [],
      recentOrders: ordersData,
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
      },
    };
  } catch (error) {
    logger.error('Error getting user context:', error);
    throw error;
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (userId: string, limit: number = 10) => {
  try {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return orders.map((order) => ({
      id: (order._id as any).toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items,
      shippingAddress: order.shippingAddress,
      tracking: order.tracking,
      timeline: order.timeline,
      createdAt: order.createdAt,
    }));
  } catch (error) {
    logger.error('Error getting user orders:', error);
    throw error;
  }
};

/**
 * Get order details by order ID or order number
 */
export const getOrderDetails = async (orderIdOrNumber: string, userId: string) => {
  try {
    let order;

    // Try to find by order number first
    order = await Order.findOne({ orderNumber: orderIdOrNumber, userId }).lean();

    // If not found, try by ID
    if (!order) {
      order = await Order.findOne({ _id: orderIdOrNumber, userId }).lean();
    }

    if (!order) {
      return null;
    }

    return {
      id: (order._id as any).toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      items: order.items,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      tracking: order.tracking,
      timeline: order.timeline,
      createdAt: order.createdAt,
    };
  } catch (error) {
    logger.error('Error getting order details:', error);
    throw error;
  }
};

/**
 * Search products
 */
export const searchProducts = async (query: string, userId?: string, limit: number = 10) => {
  try {
    const result = await getAllProductsForUsers({
      search: query,
      limit,
    });

    return result.products;
  } catch (error) {
    logger.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string) => {
  try {
    const product = await Product.findById(productId).lean();

    if (!product) {
      return null;
    }

    return {
      id: (product._id as any).toString(),
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      images: product.images,
      description: product.description,
      specifications: product.specifications,
      status: product.status,
    };
  } catch (error) {
    logger.error('Error getting product by ID:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  try {
    const user = await SignUp.findById(userId).select('name email phone role profileImage').lean();

    if (!user) {
      return null;
    }

    return {
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
    };
  } catch (error) {
    logger.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Get dealer orders (for dealer role)
 */
export const getDealerOrders = async (dealerId: string, limit: number = 10) => {
  try {
    const orders = await Order.find({ dealerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return orders.map((order) => ({
      id: (order._id as any).toString(),
      orderNumber: order.orderNumber,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items,
      createdAt: order.createdAt,
    }));
  } catch (error) {
    logger.error('Error getting dealer orders:', error);
    throw error;
  }
};

/**
 * Get dealer products (for dealer role)
 */
export const getDealerProducts = async (dealerId: string, limit: number = 10) => {
  try {
    const products = await Product.find({ userId: dealerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return products.map((product) => ({
      id: (product._id as any).toString(),
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      status: product.status,
    }));
  } catch (error) {
    logger.error('Error getting dealer products:', error);
    throw error;
  }
};

