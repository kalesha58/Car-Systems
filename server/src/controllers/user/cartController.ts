import {Request, Response} from 'express';
import {getProductByIdForUsers} from '../../services/user/productService';
import {getUserAddresses} from '../../services/user/addressService';
import {getAllCoupons} from '../../services/user/couponService';
import {Product} from '../../models/Product';
import {logger} from '../../utils/logger';
import {NotFoundError} from '../../utils/errorHandler';

/**
 * Get product stock availability
 */
export const getProductStockController = async (req: Request, res: Response) => {
  try {
    const {productId} = req.params;
    const product = await Product.findById(productId).select('stock status name');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    res.json({
      success: true,
      data: {
        productId: (product._id as any).toString(),
        stock: product.stock || 0,
        status: product.status,
        name: product.name,
        available: product.status === 'active' && (product.stock || 0) > 0,
      },
    });
  } catch (error: any) {
    logger.error('Error getting product stock:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get product stock',
    });
  }
};

/**
 * Estimate delivery time
 */
export const getDeliveryTimeEstimateController = async (req: Request, res: Response) => {
  try {
    const {addressId, dealerId, itemCount} = req.body;
    const userId = (req as any).user?.id;

    // Base delivery time
    let baseMinutes = 12;

    // Adjust based on item count
    if (itemCount > 5) {
      baseMinutes += 5;
    }

    // Adjust based on time of day
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 20) {
      baseMinutes += 8; // Rush hour
    } else if (hour >= 12 && hour <= 14) {
      baseMinutes += 5; // Lunch time
    }

    // If address provided, calculate distance-based time
    if (addressId && userId) {
      const addressesResponse = await getUserAddresses(userId);
      const address = addressesResponse?.addresses?.find((addr: any) => addr._id?.toString() === addressId || addr.id === addressId);

      if (address?.coordinates?.latitude && dealerId) {
        // In a real app, you'd get dealer location from database
        // For now, estimate based on address
        const estimatedDistance = 5; // km (placeholder)
        const distanceMinutes = Math.max(10, Math.round(estimatedDistance * 2));
        baseMinutes = Math.max(baseMinutes, distanceMinutes);
      }
    }

    // Round to nearest 5 minutes
    const roundedMinutes = Math.ceil(baseMinutes / 5) * 5;

    // Calculate time slot
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + roundedMinutes * 60000);
    const hours = deliveryDate.getHours();
    const minutes = deliveryDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');

    const slotEnd = new Date(deliveryDate);
    slotEnd.setMinutes(Math.ceil(minutes / 15) * 15 + 15);
    const endHours = slotEnd.getHours();
    const endMinutes = slotEnd.getMinutes();
    const endPeriod = endHours >= 12 ? 'PM' : 'AM';
    const endDisplayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
    const endDisplayMinutes = endMinutes.toString().padStart(2, '0');

    const timeSlot = `${displayHours}:${displayMinutes} ${period} - ${endDisplayHours}:${endDisplayMinutes} ${endPeriod}`;

    res.json({
      success: true,
      data: {
        minutes: roundedMinutes,
        timeSlot,
        estimatedDelivery: deliveryDate.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error estimating delivery time:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to estimate delivery time',
    });
  }
};

/**
 * Get related products
 */
export const getRelatedProductsController = async (req: Request, res: Response) => {
  try {
    const {productIds} = req.query;
    const limit = parseInt(req.query.limit as string) || 5;

    const productIdArray = Array.isArray(productIds)
      ? productIds
      : productIds
        ? [productIds]
        : [];

    // Get products excluding the ones in cart
    const products = await Product.find({
      _id: {$nin: productIdArray},
      status: 'active',
    })
      .limit(limit)
      .select('name price images brand categoryId')
      .lean();

    res.json({
      success: true,
      data: products.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        images: p.images,
        brand: p.brand,
        categoryId: p.categoryId,
      })),
    });
  } catch (error: any) {
    logger.error('Error getting related products:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get related products',
    });
  }
};

/**
 * Get applicable coupons
 */
export const getApplicableCouponsController = async (req: Request, res: Response) => {
  try {
    const totalAmount = parseFloat(req.query.totalAmount as string);

    logger.info(`Getting applicable coupons for totalAmount: ${totalAmount}`);

    if (!totalAmount || totalAmount <= 0) {
      logger.info('Total amount is 0 or negative, returning empty coupons');
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = (req as any).user?.id;
    const coupons = await getAllCoupons(userId);

    logger.info(`Found ${coupons.length} active coupons from database`);

    // Filter applicable coupons
    const applicableCoupons = coupons.filter((coupon: any) => {
      if (!coupon.isActive) {
        logger.debug(`Coupon ${coupon.code} is not active`);
        return false;
      }

      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);

      if (now < validFrom || now > validUntil) {
        logger.debug(`Coupon ${coupon.code} is outside validity period`);
        return false;
      }

      // Handle minOrderAmount: if it's 0 or undefined, allow it; otherwise check
      if (coupon.minOrderAmount && coupon.minOrderAmount > 0 && totalAmount < coupon.minOrderAmount) {
        logger.debug(`Coupon ${coupon.code} requires minOrderAmount ${coupon.minOrderAmount}, but cart total is ${totalAmount}`);
        return false;
      }

      return true;
    });

    logger.info(`Found ${applicableCoupons.length} applicable coupons after filtering`);

    // Sort by discount value (highest first)
    applicableCoupons.sort((a: any, b: any) => {
      const discountA =
        a.discountType === 'percentage'
          ? (totalAmount * a.discountValue) / 100
          : a.discountValue;
      const discountB =
        b.discountType === 'percentage'
          ? (totalAmount * b.discountValue) / 100
          : b.discountValue;
      return discountB - discountA;
    });

    // Transform coupons to match frontend format
    const transformedCoupons = applicableCoupons.slice(0, 5).map((coupon: any) => ({
      id: coupon.id,
      code: coupon.code,
      title: `${coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`} - ${coupon.code}`,
      description: coupon.discountType === 'percentage'
        ? `Get ${coupon.discountValue}% discount${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}`
        : `Get flat ₹${coupon.discountValue} discount`,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      applicableOn: 'all' as const,
    }));

    res.json({
      success: true,
      data: transformedCoupons,
    });
  } catch (error: any) {
    logger.error('Error getting applicable coupons:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get applicable coupons',
    });
  }
};

/**
 * Validate cart items
 */
export const validateCartItemsController = async (req: Request, res: Response) => {
  try {
    const {items} = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array',
      });
    }

    const validationResults = await Promise.all(
      items.map(async (item: any) => {
        const product = await Product.findById(item.productId).select('stock status name price');
        if (!product) {
          return {
            productId: item.productId,
            valid: false,
            error: 'Product not found',
          };
        }

        if (product.status !== 'active') {
          return {
            productId: item.productId,
            valid: false,
            error: 'Product is not available',
          };
        }

        const stock = product.stock || 0;
        if (stock < item.quantity) {
          return {
            productId: item.productId,
            valid: false,
            error: `Only ${stock} items available`,
            availableStock: stock,
          };
        }

        return {
          productId: item.productId,
          valid: true,
          availableStock: stock,
          price: product.price,
        };
      }),
    );

    const allValid = validationResults.every((result: any) => result.valid);

    res.json({
      success: true,
      data: {
        valid: allValid,
        items: validationResults,
      },
    });
  } catch (error: any) {
    logger.error('Error validating cart items:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to validate cart items',
    });
  }
};

