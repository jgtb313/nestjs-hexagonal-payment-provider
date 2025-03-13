import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column()
  paymentProviderId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column()
  method: string;

  @Column()
  currency: string;

  @Column({ type: 'int' })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
