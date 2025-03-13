import { z } from 'zod';

import { PaymentSchema, PaymentStatusSchema } from '@/support/schema';

export const CreatePaymentBodySchema = PaymentSchema.pick({
  method: true,
  currency: true,
  amount: true,
}).and(
  z.object({
    product_id: z.string().uuid(),
  }),
);
export const CreatePaymentSchemaResponse = PaymentSchema.pick({
  paymentId: true,
}).and(
  z.object({
    status: PaymentStatusSchema,
  }),
);
export type CreatePaymentBodySchemaInput = z.infer<typeof CreatePaymentBodySchema>;

export const GetPaymentParamsSchema = PaymentSchema.pick({
  paymentId: true,
});
export const GetPaymentSchemaResponse = PaymentSchema.pick({
  paymentId: true,
}).and(
  z.object({
    status: PaymentStatusSchema,
  }),
);
export type GetPaymentParamsSchemaInput = z.infer<typeof GetPaymentParamsSchema>;
