declare module 'react-native-cashfree-pg-sdk' {
  export interface CFPaymentGatewayService {
    setCallback(callbacks: {
      onVerify: (orderID: string) => void;
      onError: (error: any, orderID: string) => void;
    }): void;
    doWebPayment(session: any): void;
    removeEventSubscriber(): void;
    setEventSubscriber(subscriber: {
      onReceivedEvent: (eventName: string, map: any) => void;
    }): void;
  }

  export const CFPaymentGatewayService: CFPaymentGatewayService;
}

declare module 'cashfree-pg-api-contract' {
  export enum CFEnvironment {
    SANDBOX = 'SANDBOX',
    PRODUCTION = 'PRODUCTION',
  }

  export class CFSession {
    constructor(
      payment_session_id: string,
      order_id: string,
      environment: CFEnvironment
    );
    payment_session_id: string;
    order_id: string;
    environment: CFEnvironment;
  }
}
