import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { PaymentSchema } from '@/support/schema';
import { IPaymentRepository } from '@/ports/database/payment';
import { PaymentEntity } from './payment.typeorm.entity';

@Injectable()
export class PaymentTypeorm implements IPaymentRepository {
  private readonly repository: Repository<PaymentEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(PaymentEntity);
  }

  findById: IPaymentRepository['findById'] = async (paymentId) => {
    const model = await this.repository.findOne({ where: { paymentId } });

    if (!model) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    return PaymentSchema.parse(model);
  };

  create: IPaymentRepository['create'] = async (payment) => {
    const data = this.repository.create(payment);

    const model = await this.repository.save(data);

    return PaymentSchema.parse(model);
  };
}
