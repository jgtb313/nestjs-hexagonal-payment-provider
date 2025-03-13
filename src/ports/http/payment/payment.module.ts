import { Module } from '@nestjs/common';

import { PaymentServiceModule } from '@/core/payment';
import { PaymentController } from './payment.controller';

@Module({
  imports: [PaymentServiceModule],
  controllers: [PaymentController],
  providers: [],
})
export class PaymentModule {}
