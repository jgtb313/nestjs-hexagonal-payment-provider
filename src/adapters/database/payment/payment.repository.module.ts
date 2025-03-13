import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentTypeorm } from './payment.typeorm.adapter';
import { PaymentEntity } from './payment.typeorm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity])],
  providers: [
    {
      provide: 'PAYMENT_REPOSITORY',
      useClass: PaymentTypeorm,
    },
  ],
  exports: ['PAYMENT_REPOSITORY'],
})
export class PaymentRepositoryModule {}
