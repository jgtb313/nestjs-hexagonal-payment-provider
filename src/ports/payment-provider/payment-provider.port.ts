import { Payment, PaymentStatusEnum } from '@/support/schema';

export enum PaymentProviderError {
  INVALID_CREDIT_CARD = 'INVALID_CREDIT_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TIMEOUT = 'TIMEOUT',
  ENOTFOUND = 'ENOTFOUND',
}

export interface IPaymentProvider {
  initPayment(input: Pick<Payment, 'productId' | 'method' | 'currency' | 'amount'>): Promise<{
    paymentProviderId: string;
    status: PaymentStatusEnum;
  }>;

  getPayment(paymentProviderId: string): Promise<{
    status: PaymentStatusEnum;
  }>;
}
