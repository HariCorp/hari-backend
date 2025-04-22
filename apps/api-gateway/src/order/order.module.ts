import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { RbacModule } from '@app/common';

@Module({
  imports: [RbacModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
