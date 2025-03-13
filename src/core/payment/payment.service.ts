import { Inject, Injectable, BadRequestException, GatewayTimeoutException } from '@nestjs/common';

import { Payment } from '@/support/schema';
import { IPaymentRepository } from '@/ports/database/payment';
import { PaymentProviderError } from '@/ports/payment-provider';
import { FakePaymentProviderService } from '@/adapters/fake-payment-provider';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_REPOSITORY') private readonly paymentRepository: IPaymentRepository,
    @Inject(FakePaymentProviderService) private readonly fakePaymentProviderService: FakePaymentProviderService,
  ) {}

  async getPayment(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);

    const { status } = await this.fakePaymentProviderService.getPayment(payment.paymentProviderId);

    return {
      ...payment,
      status,
    };
  }

  async createPayment({ productId, method, currency, amount }: Pick<Payment, 'productId' | 'method' | 'currency' | 'amount'>) {
    try {
      const { paymentProviderId, status } = await this.fakePaymentProviderService.initPayment({
        productId,
        method,
        currency,
        amount,
      });

      const payment = await this.paymentRepository.create({
        productId,
        paymentProviderId,
        method,
        currency,
        amount,
      });

      return {
        ...payment,
        status,
      };
    } catch (err) {
      const error = err as Error;

      if (error.message === PaymentProviderError.INVALID_CREDIT_CARD) {
        throw new BadRequestException('Invalid credit card, check your details!');
      }

      if (error.message === PaymentProviderError.INSUFFICIENT_FUNDS) {
        throw new BadRequestException('Insufficient funds, try another method!');
      }

      if (error.message === PaymentProviderError.TIMEOUT) {
        throw new GatewayTimeoutException('Timed out, try again later!');
      }

      throw error;
    }
  }
}
