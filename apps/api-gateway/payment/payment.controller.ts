// Trong apps/api-gateway/src/payment/payment.controller.ts
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../src/auth/decorators/current-user.decorator';
import { Public } from '../src/auth/decorators/public.decorator';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() paymentData: any,
    @CurrentUser() user,
    @Req() req: Request,
  ) {
    // Thêm địa chỉ IP của client
    paymentData.ipAddr = req.ip;

    // Nếu không có returnUrl, thiết lập mặc định
    if (!paymentData.returnUrl) {
      const host = req.get('host');
      const protocol = req.protocol;
      paymentData.returnUrl = `${protocol}://${host}/payment/result`;
    }

    // Nếu không có ipnUrl, sử dụng returnUrl
    if (!paymentData.ipnUrl) {
      const host = req.get('host');
      const protocol = req.protocol;
      paymentData.ipnUrl = `${protocol}://${host}/payment/momo-ipn`;
    }

    return this.paymentService.createPayment(paymentData);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  @Get('momo-return')
  @Public()
  async momoReturn(@Query() query: any, @Res() res: Response) {
    this.logger.log(`MoMo return callback received: ${JSON.stringify(query)}`);

    // Xử lý callback từ MoMo
    const result = await this.paymentService.handleMomoReturn(query);

    // Chuyển hướng đến trang kết quả
    const redirectUrl = new URL(result.returnUrl || '/payment/result');
    redirectUrl.searchParams.append(
      'status',
      result.success ? 'success' : 'failed',
    );
    redirectUrl.searchParams.append('orderId', result.orderId || '');
    if (result.message) {
      redirectUrl.searchParams.append('message', result.message);
    }

    return res.redirect(redirectUrl.toString());
  }

  @Post('momo-ipn')
  @Public()
  async momoIPN(@Body() body: any) {
    this.logger.log(`MoMo IPN callback received: ${JSON.stringify(body)}`);
    return this.paymentService.handleMomoIPN(body);
  }

  @Get('result')
  @Public()
  async paymentResult(@Query() query: any) {
    return {
      success: query.status === 'success',
      message: query.message || 'Kết quả thanh toán',
      orderId: query.orderId,
    };
  }
}
