import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { FakePaymentProviderService } from './fake-payment-provider.service';

@Module({
  imports: [HttpModule],
  providers: [FakePaymentProviderService],
  exports: [FakePaymentProviderService],
})
export class FakePaymentProviderModule {}
