import { z } from 'zod';

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  CANCELED = 'CANCELED',
}

export enum PaymentMethodEnum {
  PAYPAL = 'PAYPAL',
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
}

export enum PaymentCurrencyEnum {
  BRL = 'BRL',
}

export const PaymentStatusSchema = z.nativeEnum(PaymentStatusEnum);

export const PaymentSchema = z.object({
  paymentId: z.string().uuid(),
  paymentProviderId: z.string(),
  productId: z.string().uuid(),
  method: z.nativeEnum(PaymentMethodEnum),
  currency: z.nativeEnum(PaymentCurrencyEnum),
  amount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Payment = z.infer<typeof PaymentSchema>;
