import { Payment } from '@/support/schema';

export interface IPaymentRepository {
  findById(paymentId: string): Promise<Payment>;
  create(input: Omit<Payment, 'paymentId' | 'createdAt' | 'updatedAt'>): Promise<Payment>;
}
