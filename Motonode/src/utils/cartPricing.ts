export type AppliedCoupon = {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
} | null;

export type CartPricingLine = {
  product: {
    price: number;
    originalPrice?: number;
  };
  quantity: number;
};

export type CartPricingResult = {
  mrpSubtotal: number;
  saleSubtotal: number;
  productDiscount: number;
  couponDiscount: number;
  shipping: number;
  payable: number;
  amountSaved: number;
  couponCode: string | null;
};

function lineMrp(item: CartPricingLine): number {
  const mrp = item.product.originalPrice ?? item.product.price;
  return Math.max(mrp, item.product.price) * item.quantity;
}

function lineSale(item: CartPricingLine): number {
  return item.product.price * item.quantity;
}

function computeCouponDiscount(saleSubtotal: number, coupon: AppliedCoupon): number {
  if (!coupon || coupon.value <= 0) return 0;
  if (coupon.type === 'percentage') {
    return Math.min(saleSubtotal, Math.round(saleSubtotal * (coupon.value / 100)));
  }
  return Math.min(saleSubtotal, coupon.value);
}

export function computeCartPricing(
  items: CartPricingLine[],
  coupon: AppliedCoupon = null,
): CartPricingResult {
  let mrpSubtotal = 0;
  let saleSubtotal = 0;

  for (const item of items) {
    mrpSubtotal += lineMrp(item);
    saleSubtotal += lineSale(item);
  }

  const productDiscount = Math.max(0, mrpSubtotal - saleSubtotal);
  const couponDiscount = computeCouponDiscount(saleSubtotal, coupon);
  const shipping = 0;
  const payable = Math.max(0, saleSubtotal - couponDiscount + shipping);
  const amountSaved = productDiscount + couponDiscount;

  return {
    mrpSubtotal,
    saleSubtotal,
    productDiscount,
    couponDiscount,
    shipping,
    payable,
    amountSaved,
    couponCode: coupon?.code ?? null,
  };
}
