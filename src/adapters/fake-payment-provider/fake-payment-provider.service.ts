import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

import { PaymentMethodEnum, PaymentStatusEnum } from '@/support/schema';
import { IPaymentProvider, PaymentProviderError } from '@/ports/payment-provider';

type FakePaymentProviderStatus = 'pending' | 'processed' | 'canceled';

type FakePaymentProviderInitPaymentInput = {
  product_id: string;
  payment_method: string;
  money: {
    currency: string;
    amount: number;
  };
};

type FakePaymentProviderInitPaymentResponse = {
  tx_id: string;
  status: FakePaymentProviderStatus;
};

type FakePaymentProviderGetPaymentResponse = {
  tx_id: string;
  status: FakePaymentProviderStatus;
};

@Injectable()
export class FakePaymentProviderService implements IPaymentProvider {
  private readonly baseURL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseURL = this.configService.get('FAKE_PAYMENT_PROVIDER_BASE_URL')!;
  }

  initPayment: IPaymentProvider['initPayment'] = async ({ productId, method, currency, amount }) => {
    const input: FakePaymentProviderInitPaymentInput = {
      product_id: productId,
      payment_method: this.parsePaymentMethod(method),
      money: {
        currency,
        amount,
      },
    };

    try {
      const { data } = await lastValueFrom(
        this.httpService.post<FakePaymentProviderInitPaymentResponse>(`${this.baseURL}/init-payment`, input, {
          params: {
            api_key: this.configService.get('FAKE_PAYMENT_PROVIDER_API_KEY')!,
          },
        }),
      );

      return {
        paymentProviderId: data.tx_id,
        status: this.parseStatus(data.status),
      };
    } catch (err) {
      const error = err as Error;

      if (error.message === 'Invalid Credit Card') {
        throw new Error(PaymentProviderError.INVALID_CREDIT_CARD);
      }

      if (error.message === 'Insufficent Funds') {
        throw new Error(PaymentProviderError.INSUFFICIENT_FUNDS);
      }

      if (error.message === 'Timeout') {
        throw new Error(PaymentProviderError.TIMEOUT);
      }

      throw error;
    }
  };

  getPayment: IPaymentProvider['getPayment'] = async (paymentProviderId) => {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<FakePaymentProviderGetPaymentResponse>(`${this.baseURL}/list-payment/${paymentProviderId}`, {
          params: {
            api_key: this.configService.get('FAKE_PAYMENT_PROVIDER_API_KEY')!,
          },
        }),
      );

      return {
        paymentProviderId: data.tx_id,
        status: this.parseStatus(data.status),
      };
    } catch (error) {
      throw error;
    }
  };

  private parsePaymentMethod(status: string) {
    const mapping: Record<PaymentMethodEnum, string> = {
      PAYPAL: 'pay-pal',
      CREDIT_CARD: 'credit-card',
      PIX: 'pix',
      BOLETO: 'boleto',
    };

    return mapping[status];
  }

  private parseStatus(status: string) {
    const mapping: Record<FakePaymentProviderStatus, PaymentStatusEnum> = {
      pending: PaymentStatusEnum.PENDING,
      processed: PaymentStatusEnum.PROCESSED,
      canceled: PaymentStatusEnum.CANCELED,
    };

    return mapping[status];
  }
}
