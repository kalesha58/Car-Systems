import {ICoupon} from '@types/coupon/ICoupon';

export const dummyCoupons: ICoupon[] = [
  {
    id: '1',
    code: 'WELCOME50',
    title: 'Welcome Offer',
    description: 'Get 50% off on your first order',
    discountType: 'percentage',
    discountValue: 50,
    minOrderAmount: 500,
    maxDiscountAmount: 1000,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isActive: true,
    applicableOn: 'all',
  },
  {
    id: '2',
    code: 'SAVE200',
    title: 'Flat ₹200 Off',
    description: 'Get flat ₹200 discount on orders above ₹1000',
    discountType: 'fixed',
    discountValue: 200,
    minOrderAmount: 1000,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    isActive: true,
    applicableOn: 'all',
  },
  {
    id: '3',
    code: 'CAR25',
    title: 'Car Accessories Special',
    description: 'Get 25% off on all car accessories',
    discountType: 'percentage',
    discountValue: 25,
    minOrderAmount: 300,
    maxDiscountAmount: 500,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    isActive: true,
    applicableOn: 'products',
  },
  {
    id: '4',
    code: 'FREESHIP',
    title: 'Free Shipping',
    description: 'Get free shipping on orders above ₹500',
    discountType: 'fixed',
    discountValue: 29, // Delivery charge
    minOrderAmount: 500,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    isActive: true,
    applicableOn: 'all',
  },
  {
    id: '5',
    code: 'MEGA100',
    title: 'Mega Sale',
    description: 'Get ₹100 off on orders above ₹800',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 800,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isActive: true,
    applicableOn: 'all',
  },
  {
    id: '6',
    code: 'SERVICE30',
    title: 'Service Discount',
    description: 'Get 30% off on all services',
    discountType: 'percentage',
    discountValue: 30,
    minOrderAmount: 1000,
    maxDiscountAmount: 1500,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    isActive: true,
    applicableOn: 'services',
  },
];

