import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RbacModule } from '@app/common';

@Module({
  imports: [RbacModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
