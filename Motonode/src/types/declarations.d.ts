declare module '*.png' {
  const value: number | string;
  export default value;
}

declare module '*.jpg' {
  const value: number | string;
  export default value;
}

declare module '*.jpeg' {
  const value: number | string;
  export default value;
}

declare module '*.webp' {
  const value: number | string;
  export default value;
}

declare module '*.gif' {
  const value: number | string;
  export default value;
}

declare module '*.woff2' {
  const value: string;
  export default value;
}

declare module 'react-native-razorpay' {
  interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
    };
  }

  interface RazorpayCheckout {
    open(options: RazorpayCheckoutOptions): Promise<{
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }>;
  }

  const RazorpayCheckout: RazorpayCheckout;
  export default RazorpayCheckout;
}
