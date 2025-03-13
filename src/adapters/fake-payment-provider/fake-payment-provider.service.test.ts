import { describe, it, beforeEach, vi, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { PaymentMethodEnum, PaymentCurrencyEnum, PaymentStatusEnum } from '@/support/schema';
import { PaymentProviderError } from '@/ports/payment-provider';
import { FakePaymentProviderService } from './fake-payment-provider.service';

describe('FakePaymentProviderService', () => {
  let service: FakePaymentProviderService;
  let httpServiceMock: HttpService;
  let configServiceMock: ConfigService;

  beforeEach(async () => {
    configServiceMock = {
      get: vi.fn((key: string) => {
        if (key === 'FAKE_PAYMENT_PROVIDER_BASE_URL') {
          return 'http://fake-payment-provider.com';
        }

        if (key === 'FAKE_PAYMENT_PROVIDER_API_KEY') {
          return 'fake-api-key';
        }
      }),
    } as unknown as ConfigService;

    httpServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as HttpService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FakePaymentProviderService,
        {
          provide: ConfigService,
          useFactory: () => configServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    service = module.get(FakePaymentProviderService);

    vi.restoreAllMocks();
  });

  describe('initPayment', () => {
    it('should initialize a payment with correct parameters and return payment details', async () => {
      // Arrange
      const input = {
        productId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockResponseData = {
        tx_id: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        status: 'pending',
      };
      const mockAxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
      } as AxiosResponse<{ tx_id: string; status: string }>;
      vi.mocked(httpServiceMock.post).mockReturnValue(of(mockAxiosResponse));

      // Act
      const result = await service.initPayment(input);

      // Assert
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        'http://fake-payment-provider.com/init-payment',
        {
          product_id: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
          payment_method: 'credit-card',
          money: {
            currency: 'BRL',
            amount: 100,
          },
        },
        {
          params: {
            api_key: 'fake-api-key',
          },
        },
      );
      expect(result).toEqual({
        paymentProviderId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        status: PaymentStatusEnum.PENDING,
      });
    });

    it('should use baseURL and apiKey from config service for the API call', async () => {
      // Arrange
      const input = {
        productId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockAxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
      } as AxiosResponse<{ tx_id: string; status: string }>;
      vi.mocked(httpServiceMock.post).mockReturnValue(of(mockAxiosResponse));

      // Act
      await service.initPayment(input);

      // Assert
      expect(httpServiceMock.post).toHaveBeenCalledWith(expect.stringContaining('http://fake-payment-provider.com'), expect.any(Object), {
        params: {
          api_key: 'fake-api-key',
        },
      });
    });

    it('should throw an error if the HTTP request fails', async () => {
      // Arrange
      const input = {
        productId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockError = new Error('HTTP request failed');
      vi.mocked(httpServiceMock.post).mockReturnValue(throwError(() => mockError));

      // Act & Assert
      await expect(service.initPayment(input)).rejects.toThrow('HTTP request failed');
      expect(httpServiceMock.post).toHaveBeenCalled();
    });

    it.each([
      { providerStatus: 'pending', expectedStatus: PaymentStatusEnum.PENDING },
      {
        providerStatus: 'processed',
        expectedStatus: PaymentStatusEnum.PROCESSED,
      },
      {
        providerStatus: 'canceled',
        expectedStatus: PaymentStatusEnum.CANCELED,
      },
    ])('should map provider status "$providerStatus" to $expectedStatus', async ({ providerStatus, expectedStatus }) => {
      // Arrange
      const input = {
        productId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      const mockResponseData = {
        tx_id: 'tx_123',
        status: providerStatus,
      };
      const mockAxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
      } as AxiosResponse<{ tx_id: string; status: string }>;
      vi.mocked(httpServiceMock.post).mockReturnValue(of(mockAxiosResponse));

      // Act
      const result = await service.initPayment(input);

      // Assert
      expect(result).toEqual({
        paymentProviderId: 'tx_123',
        status: expectedStatus,
      });
    });

    it.each([
      { error: 'Invalid Credit Card', expectedMessage: PaymentProviderError.INVALID_CREDIT_CARD },
      { error: 'Insufficent Funds', expectedMessage: PaymentProviderError.INSUFFICIENT_FUNDS },
      { error: 'Timeout', expectedMessage: PaymentProviderError.TIMEOUT },
    ])('should throw error "$error" when retrieving payment fails with that reason', async ({ error, expectedMessage }) => {
      // Arrange
      const input = {
        productId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        method: PaymentMethodEnum.CREDIT_CARD,
        currency: PaymentCurrencyEnum.BRL,
        amount: 100,
      };
      vi.mocked(httpServiceMock.post).mockReturnValue(throwError(() => new Error(error)));

      // Act
      await expect(service.initPayment(input)).rejects.toThrow(expectedMessage);

      // Assert
      expect(httpServiceMock.post).toHaveBeenCalled();
    });
  });

  describe('getPayment', () => {
    it('should retrieve payment details for a given paymentProviderId', async () => {
      // Arrange
      const paymentProviderId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockResponseData = {
        tx_id: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        status: 'pending',
      };
      const mockAxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
      } as AxiosResponse<{ tx_id: string; status: string }>;
      vi.mocked(httpServiceMock.get).mockReturnValue(of(mockAxiosResponse));

      // Act
      const result = await service.getPayment(paymentProviderId);

      // Assert
      expect(httpServiceMock.get).toHaveBeenCalledWith(`http://fake-payment-provider.com/list-payment/${paymentProviderId}`, {
        params: {
          api_key: 'fake-api-key',
        },
      });
      expect(result).toEqual({
        paymentProviderId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        status: PaymentStatusEnum.PENDING,
      });
    });

    it('should use baseURL and apiKey from config service for the API call', async () => {
      // Arrange
      const paymentProviderId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockAxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
      } as AxiosResponse<{ tx_id: string; status: string }>;
      vi.mocked(httpServiceMock.get).mockReturnValue(of(mockAxiosResponse));

      // Act
      await service.getPayment(paymentProviderId);

      // Assert
      expect(httpServiceMock.get).toHaveBeenCalledWith(expect.stringContaining('http://fake-payment-provider.com'), {
        params: {
          api_key: 'fake-api-key',
        },
      });
    });

    it('should throw an error if the HTTP request fails', async () => {
      // Arrange
      const paymentProviderId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockError = new Error('HTTP request failed');
      vi.mocked(httpServiceMock.get).mockReturnValue(throwError(() => mockError));

      // Act & Assert
      await expect(service.getPayment(paymentProviderId)).rejects.toThrow('HTTP request failed');
      expect(httpServiceMock.get).toHaveBeenCalled();
    });

    it.each([
      { providerStatus: 'pending', expectedStatus: PaymentStatusEnum.PENDING },
      {
        providerStatus: 'processed',
        expectedStatus: PaymentStatusEnum.PROCESSED,
      },
      {
        providerStatus: 'canceled',
        expectedStatus: PaymentStatusEnum.CANCELED,
      },
    ])('should map provider status "$providerStatus" to $expectedStatus', async ({ providerStatus, expectedStatus }) => {
      // Arrange
      const paymentProviderId = '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a';
      const mockResponseData = {
        tx_id: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        status: providerStatus,
      };
      const mockAxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
      } as AxiosResponse<{ tx_id: string; status: string }>;
      vi.mocked(httpServiceMock.get).mockReturnValue(of(mockAxiosResponse));

      // Act
      const result = await service.getPayment(paymentProviderId);

      // Assert
      expect(result).toEqual({
        paymentProviderId: '1dfd4343-3fc1-4dcd-b0ba-47df4962e77a',
        status: expectedStatus,
      });
    });
  });
});
