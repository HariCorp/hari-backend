// Trong apps/api-gateway/src/payment/payment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async createPayment(paymentData: any) {
    try {
      const command = {
        data: paymentData,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Creating payment for order: ${paymentData.orderId}`);
      const response = await this.kafkaProducer.sendAndReceive(
        'ms.payment.create',
        command,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`);
      throw error;
    }
  }

  async handleMomoReturn(query: any) {
    try {
      // Lấy thông tin thanh toán từ orderId trong callback
      const paymentId = query.orderId;
      const payment: any = await this.getPayment(paymentId);

      return {
        success: query.resultCode === '0',
        orderId: payment?.orderId || query.orderId,
        message:
          query.message ||
          (query.resultCode === '0'
            ? 'Thanh toán thành công'
            : 'Thanh toán thất bại'),
        returnUrl: payment?.metadata?.returnUrl || '/payment/result',
      };
    } catch (error) {
      this.logger.error(`Failed to handle MoMo return: ${error.message}`);
      return {
        success: false,
        message: error.message,
        returnUrl: '/payment/result',
      };
    }
  }

  async handleMomoIPN(body: any) {
    try {
      const command = {
        data: body,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Forwarding MoMo IPN to payment service`);
      const response = await this.kafkaProducer.sendAndReceive(
        'ms.payment.handleMomoCallback',
        command,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to handle MoMo IPN: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getPayment(id: string) {
    try {
      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Getting payment with ID: ${id}`);
      const response = await this.kafkaProducer.sendAndReceive(
        'ms.payment.getById',
        command,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get payment: ${error.message}`);
      throw error;
    }
  }

  async getPaymentByOrderId(orderId: string) {
    try {
      const command = {
        orderId,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Getting payment for order: ${orderId}`);
      const response = await this.kafkaProducer.sendAndReceive(
        'ms.payment.getByOrderId',
        command,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get payment: ${error.message}`);
      throw error;
    }
  }
}
