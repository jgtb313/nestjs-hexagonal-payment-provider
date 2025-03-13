import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { UseZodGuard, zodToOpenAPI } from 'nestjs-zod';

import { Request, RequestInput } from '@/support/decorators';
import { PaymentService } from '@/core/payment';
import {
  GetPaymentParamsSchema,
  GetPaymentSchemaResponse,
  CreatePaymentBodySchema,
  CreatePaymentSchemaResponse,
  GetPaymentParamsSchemaInput,
  CreatePaymentBodySchemaInput,
} from './payment.controller.schema';

@ApiTags('Payment')
@Controller('/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('/:paymentId')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'This endpoint retrieves a specific payment using its payment ID.',
  })
  @ApiParam({ name: 'paymentId', schema: zodToOpenAPI(z.string().uuid()) })
  @ApiResponse({ schema: zodToOpenAPI(CreatePaymentSchemaResponse), status: 200 })
  @UseZodGuard('params', GetPaymentParamsSchema)
  async getPayment(@Request() { params }: RequestInput<{}, GetPaymentParamsSchemaInput, {}>) {
    const response = await this.paymentService.getPayment(params.paymentId);

    return GetPaymentSchemaResponse.parse(response);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new payment',
    description: 'This endpoint creates a new payment request.',
  })
  @ApiBody({ schema: zodToOpenAPI(CreatePaymentBodySchema) })
  @ApiResponse({ schema: zodToOpenAPI(CreatePaymentSchemaResponse), status: 200 })
  @UseZodGuard('body', CreatePaymentBodySchema)
  async createPayment(@Request() { body }: RequestInput<{}, {}, CreatePaymentBodySchemaInput>) {
    const response = await this.paymentService.createPayment({
      ...body,
      productId: body.product_id,
    });

    return CreatePaymentSchemaResponse.parse(response);
  }
}
