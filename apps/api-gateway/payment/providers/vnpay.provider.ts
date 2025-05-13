import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import * as moment from 'moment';

@Injectable()
export class VnPayProvider {
  private readonly logger = new Logger(VnPayProvider.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;

  constructor(private configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE', '');
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET', '');
    this.paymentUrl = this.configService.get<string>(
      'VNPAY_PAYMENT_URL',
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  async createPaymentUrl(
    orderId: string,
    amount: number,
    returnUrl: string,
    ipAddr: string,
    orderInfo: string = 'Thanh toán đơn hàng',
    locale: string = 'vn',
  ): Promise<string> {
    try {
      const createDate = moment().format('YYYYMMDDHHmmss');
      const currCode = 'VND';

      // Tạo các tham số thanh toán
      let vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.tmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100, // VNPay yêu cầu số tiền * 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };

      // Sắp xếp các tham số theo thứ tự a-z
      const sortedParams = this.sortObject(vnpParams);

      // Tạo chuỗi để tạo chữ ký
      const signData = querystring.stringify(
        sortedParams as querystring.ParsedUrlQueryInput,
      );

      // Tạo chữ ký
      const hmac = crypto.createHmac('sha512', this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Thêm chữ ký vào tham số
      sortedParams['vnp_SecureHash'] = signed;

      // Tạo URL thanh toán
      const paymentUrl = `${this.paymentUrl}?${querystring.stringify(sortedParams as querystring.ParsedUrlQueryInput)}`;

      return paymentUrl;
    } catch (error) {
      this.logger.error(`Error creating VNPay payment URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Hàm hỗ trợ sắp xếp object theo key
   */
  private sortObject(obj: any) {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (obj[key] !== null && obj[key] !== undefined) {
        sorted[key] = obj[key];
      }
    }

    return sorted;
  }
}
