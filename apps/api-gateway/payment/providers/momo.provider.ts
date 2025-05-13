import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MomoProvider {
  private readonly logger = new Logger(MomoProvider.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly paymentEndpoint: string;

  constructor(private configService: ConfigService) {
    this.partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE', '');
    this.accessKey = this.configService.get<string>('MOMO_ACCESS_KEY', '');
    this.secretKey = this.configService.get<string>('MOMO_SECRET_KEY', '');
    this.paymentEndpoint = this.configService.get<string>(
      'MOMO_PAYMENT_ENDPOINT',
      'https://test-payment.momo.vn/v2/gateway/api/create',
    );
  }

  /**
   * Tạo URL thanh toán MoMo
   */
  async createPaymentUrl(
    orderId: string,
    amount: number,
    returnUrl: string,
    ipnUrl: string,
    orderInfo: string = 'Thanh toán đơn hàng',
    extraData: string = '',
  ): Promise<string> {
    try {
      // Tạo requestId ngẫu nhiên
      const requestId = `${Date.now()}_${orderId}`;
      const requestType = 'captureWallet';

      // Chuẩn bị dữ liệu để tạo signature
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

      // Tạo signature
      const signature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      // Tạo body request
      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: returnUrl,
        ipnUrl: ipnUrl || returnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'vi',
      };

      // Gửi request đến MoMo
      const response = await fetch(this.paymentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseJson = await response.json();

      if (responseJson.resultCode === 0) {
        return responseJson.payUrl;
      } else {
        this.logger.error(
          `MoMo payment URL creation failed: ${responseJson.message}`,
        );
        throw new Error(
          responseJson.message || 'Cannot create MoMo payment URL',
        );
      }
    } catch (error) {
      this.logger.error(`Error creating MoMo payment URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Xác minh callback từ MoMo
   */
  verifyCallback(params: any): {
    isValid: boolean;
    orderId: string;
    amount: number;
    transactionId?: string;
  } {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature,
      } = params;

      // Tạo chuỗi để kiểm tra signature
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      // Tạo signature để so sánh
      const computedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      // So sánh signature
      const isValid = computedSignature === signature && resultCode === '0';

      return {
        isValid,
        orderId,
        amount: parseInt(amount),
        transactionId: transId,
      };
    } catch (error) {
      this.logger.error(`Error verifying MoMo callback: ${error.message}`);
      return {
        isValid: false,
        orderId: params.orderId || '',
        amount: parseInt(params.amount || '0'),
      };
    }
  }
}
