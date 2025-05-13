import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PaymentService } from './payment-service.service';

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('ms.payment.create')
  async createPayment(command: { data: any }) {
    try {
      this.logger.log(`Creating payment for order: ${command.data.orderId}`);
      const result = await this.paymentService.createPayment(command.data);

      return {
        status: result.success ? 'success' : 'error',
        data: result,
        error: !result.success ? { message: result.message } : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failedd to create payment: ${error.message}`,
        error.stack,
      );
      return {
        status: 'error',
        error: {
          code: 'PAYMENT_CREATE_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.payment.handleMomoCallback')
  async handleMomoCallback(command: { data: any }) {
    try {
      this.logger.log(`Handling MoMo callback`);
      const result = await this.paymentService.handleMomoCallback(command.data);

      return {
        status: result.success ? 'success' : 'error',
        data: result,
        error: !result.success ? { message: result.message } : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to handle MoMo callback: ${error.message}`,
        error.stack,
      );
      return {
        status: 'error',
        error: {
          code: 'MOMO_CALLBACK_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.payment.getByOrderId')
  async getPaymentByOrderId(command: { orderId: string }) {
    try {
      this.logger.log(`Getting payment for order: ${command.orderId}`);
      const payment = await this.paymentService.getPaymentByOrderId(
        command.orderId,
      );

      return {
        status: 'success',
        data: payment,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'PAYMENT_GET_ERROR',
          message: error.message,
        },
      };
    }
  }
}
