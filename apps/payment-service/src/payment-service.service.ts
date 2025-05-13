import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@app/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { KafkaProducerService } from '@app/common';
import { MomoProvider } from 'apps/api-gateway/payment/providers/momo.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly momoProvider: MomoProvider,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Tạo một giao dịch thanh toán mới
   */
  async createPayment(createPaymentDto: any): Promise<any> {
    try {
      const { orderId, amount, paymentMethod, returnUrl, ipnUrl, orderInfo } =
        createPaymentDto;

      // Tạo bản ghi thanh toán trong database
      const payment = await this.paymentModel.create({
        orderId,
        amount,
        paymentMethod,
        status: PaymentStatus.PENDING,
        metadata: {
          returnUrl,
          ipnUrl,
          orderInfo,
        },
      });

      // Xử lý theo phương thức thanh toán
      if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
        // Tạo URL thanh toán MoMo
        const paymentUrl = await this.momoProvider.createPaymentUrl(
          payment._id.toString(), // Sử dụng ID của payment làm orderId
          amount,
          returnUrl,
          ipnUrl || returnUrl,
          orderInfo || 'Thanh toán đơn hàng',
          '', // extraData
        );

        // Cập nhật paymentUrl vào bản ghi thanh toán
        await this.paymentModel.findByIdAndUpdate(payment._id, {
          paymentUrl,
        });

        return {
          success: true,
          paymentUrl,
          orderId: payment._id.toString(),
        };
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create payment: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Xử lý callback từ MoMo
   */
  async handleMomoCallback(params: any): Promise<any> {
    try {
      // Xác minh callback
      const verifyResult = this.momoProvider.verifyCallback(params);

      if (!verifyResult.isValid) {
        this.logger.warn('Invalid MoMo callback signature');
        return {
          success: false,
          message: 'Invalid signature',
        };
      }

      // Tìm bản ghi thanh toán
      const payment = await this.paymentModel.findById(verifyResult.orderId);

      if (!payment) {
        this.logger.warn(`Payment not found: ${verifyResult.orderId}`);
        return {
          success: false,
          message: 'Payment not found',
        };
      }

      // Cập nhật trạng thái thanh toán
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        status: PaymentStatus.COMPLETED,
        transactionId: verifyResult.transactionId,
        completedAt: new Date(),
        metadata: {
          ...payment.metadata,
          responseParams: params,
        },
      });

      // Gửi thông báo về trạng thái thanh toán qua Kafka
      await this.kafkaProducer.send('ms.payment.completed', {
        paymentId: payment._id.toString(),
        orderId: payment.orderId,
        status: PaymentStatus.COMPLETED,
        transactionId: verifyResult.transactionId,
        amount: verifyResult.amount,
      });

      return {
        success: true,
        message: 'Payment completed successfully',
        orderId: payment.orderId,
        transactionId: verifyResult.transactionId,
        amount: verifyResult.amount,
      };
    } catch (error) {
      this.logger.error(
        `Error handling MoMo callback: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Lấy thông tin thanh toán
   */
  async getPayment(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Lấy thông tin thanh toán theo orderId
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentModel.findOne({ orderId });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }
}
