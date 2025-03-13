import 'reflect-metadata';

import { describe, it, beforeEach, vi, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { IPaymentRepository } from '@/ports/database/payment';
import { IPaymentProvider, PaymentProviderError } from '@/ports/payment-provider';
import { FakePaymentProviderService } from '@/adapters/fake-payment-provider';
import { PaymentMethodEnum, PaymentCurrencyEnum, PaymentStatusEnum } from '@/support/schema';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepositoryMock: IPaymentRepository;
  let fakePaymentProviderServiceMock: IPaymentProvider;

  beforeEach(async () => {
    paymentRepositoryMock = {
      findById: vi.fn(),
      create: vi.fn(),
    } as unknown as IPaymentRepository;

    fakePaymentProviderServiceMock = {
      initPayment: vi.fn(),
      getPayment: vi.fn(),
    } as unknown as IPaymentProvider;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: 'PAYMENT_REPOSITORY',
          useValue: paymentRepositoryMock,
        },
        {
          provide: FakePaymentProviderService,
          useValue: fakePaymentProviderServiceMock,
        },
      ],
    }).compile();

    service = module.get(PaymentService);

    vi.restoreAllMocks();
  });

  describe('getPayment', () => {
    it('should retrieve payment from repository using paymentId', async () => {
      // Arrange
      const paymentId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockPayment = {
        paymentId,
        paymentProviderId: 'tx_123',
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      vi.mocked(paymentRepositoryMock.findById).mockResolvedValue(mockPayment);
      vi.mocked(fakePaymentProviderServiceMock.getPayment).mockResolvedValue(mockProviderResponse);

      // Act
      await service.getPayment(paymentId);

      // Assert
      expect(paymentRepositoryMock.findById).toHaveBeenCalledWith(paymentId);
    });

    it('should fetch payment status from payment provider using paymentProviderId', async () => {
      // Arrange
      const paymentId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockPayment = {
        paymentId,
        paymentProviderId: 'tx_123',
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      vi.mocked(paymentRepositoryMock.findById).mockResolvedValue(mockPayment);
      vi.mocked(fakePaymentProviderServiceMock.getPayment).mockResolvedValue(mockProviderResponse);

      // Act
      await service.getPayment(paymentId);

      // Assert
      expect(fakePaymentProviderServiceMock.getPayment).toHaveBeenCalledWith('tx_123');
    });

    it('should return payment data combined with updated status', async () => {
      // Arrange
      const paymentId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockPayment = {
        paymentId,
        paymentProviderId: 'tx_123',
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      vi.mocked(paymentRepositoryMock.findById).mockResolvedValue(mockPayment);
      vi.mocked(fakePaymentProviderServiceMock.getPayment).mockResolvedValue(mockProviderResponse);

      // Act
      const result = await service.getPayment(paymentId);

      // Assert
      expect(result).toEqual({
        ...mockPayment,
        status: PaymentStatusEnum.PENDING,
      });
    });

    it('should throw an error if payment is not found in repository', async () => {
      // Arrange
      const paymentId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockError = new Error('Payment not found');
      vi.mocked(paymentRepositoryMock.findById).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getPayment(paymentId)).rejects.toThrow();
      expect(paymentRepositoryMock.findById).toHaveBeenCalledWith(paymentId);
      expect(fakePaymentProviderServiceMock.getPayment).not.toHaveBeenCalled();
    });

    it('should throw an error if payment provider request fails', async () => {
      // Arrange
      const paymentId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockPayment = {
        paymentId,
        paymentProviderId: 'tx_123',
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockError = new Error('Provider request failed');
      vi.mocked(paymentRepositoryMock.findById).mockResolvedValue(mockPayment);
      vi.mocked(fakePaymentProviderServiceMock.getPayment).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getPayment(paymentId)).rejects.toThrow('Provider request failed');
      expect(paymentRepositoryMock.findById).toHaveBeenCalledWith(paymentId);
      expect(fakePaymentProviderServiceMock.getPayment).toHaveBeenCalledWith('tx_123');
    });
  });

  describe('createPayment', () => {
    it('should initialize payment through payment provider with correct parameters', async () => {
      // Arrange
      const input = {
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      const mockPayment = {
        paymentId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        productId: 'prod_123',
        paymentProviderId: 'tx_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(fakePaymentProviderServiceMock.initPayment).mockResolvedValue(mockProviderResponse);
      vi.mocked(paymentRepositoryMock.create).mockResolvedValue(mockPayment);

      // Act
      await service.createPayment(input);

      // Assert
      expect(fakePaymentProviderServiceMock.initPayment).toHaveBeenCalledWith({
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      });
    });

    it('should create payment in repository with paymentProviderId and input data', async () => {
      // Arrange
      const input = {
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      const mockPayment = {
        paymentId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        productId: 'prod_123',
        paymentProviderId: 'tx_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(fakePaymentProviderServiceMock.initPayment).mockResolvedValue(mockProviderResponse);
      vi.mocked(paymentRepositoryMock.create).mockResolvedValue(mockPayment);

      // Act
      await service.createPayment(input);

      // Assert
      expect(paymentRepositoryMock.create).toHaveBeenCalledWith({
        productId: 'prod_123',
        paymentProviderId: 'tx_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      });
    });

    it('should return created payment combined with status from provider', async () => {
      // Arrange
      const input = {
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      const mockPayment = {
        paymentId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        productId: 'prod_123',
        paymentProviderId: 'tx_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(fakePaymentProviderServiceMock.initPayment).mockResolvedValue(mockProviderResponse);
      vi.mocked(paymentRepositoryMock.create).mockResolvedValue(mockPayment);

      // Act
      const result = await service.createPayment(input);

      // Assert
      expect(result).toEqual({
        ...mockPayment,
        status: PaymentStatusEnum.PENDING,
      });
    });

    it('should throw an error if payment provider initialization fails', async () => {
      // Arrange
      const input = {
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockError = new Error('Provider initialization failed');
      vi.mocked(fakePaymentProviderServiceMock.initPayment).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.createPayment(input)).rejects.toThrow('Provider initialization failed');
      expect(fakePaymentProviderServiceMock.initPayment).toHaveBeenCalledWith({
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      });
      expect(paymentRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('should throw an error if repository creation fails', async () => {
      // Arrange
      const input = {
        productId: 'prod_123',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockProviderResponse = {
        paymentProviderId: 'tx_123',
        status: PaymentStatusEnum.PENDING,
      };
      const mockError = new Error('Repository creation failed');
      vi.mocked(fakePaymentProviderServiceMock.initPayment).mockResolvedValue(mockProviderResponse);
      vi.mocked(paymentRepositoryMock.create).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.createPayment(input)).rejects.toThrow('Repository creation failed');
      expect(fakePaymentProviderServiceMock.initPayment).toHaveBeenCalled();
      expect(paymentRepositoryMock.create).toHaveBeenCalled();
    });

    it.each([
      { error: PaymentProviderError.INVALID_CREDIT_CARD, expectedMessage: 'Invalid credit card, check your details!' },
      { error: PaymentProviderError.INSUFFICIENT_FUNDS, expectedMessage: 'Insufficient funds, try another method!' },
      { error: PaymentProviderError.TIMEOUT, expectedMessage: 'Timed out, try again later!' },
    ])('should throw error "$error" when retrieving payment fails with that reason', async ({ error, expectedMessage }) => {
      // Arrange
      const input = {
        productId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const err = new Error(error);
      vi.mocked(fakePaymentProviderServiceMock.initPayment).mockRejectedValue(err);

      // Act
      await expect(service.createPayment(input)).rejects.toThrow(expectedMessage);

      // Assert
      expect(fakePaymentProviderServiceMock.initPayment).toHaveBeenCalled();
    });
  });
});
