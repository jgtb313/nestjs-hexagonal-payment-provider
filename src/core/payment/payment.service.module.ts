import { Module } from '@nestjs/common';

import { PaymentRepositoryModule } from '@/adapters/database/payment';
import { FakePaymentProviderModule } from '@/adapters/fake-payment-provider';
import { PaymentService } from './payment.service';

@Module({
  imports: [PaymentRepositoryModule, FakePaymentProviderModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentServiceModule {}
