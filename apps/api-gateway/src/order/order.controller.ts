import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentMethod, RolesGuard } from '@app/common';
import {
  UserVerifiedGuard,
  VerificationErrorMessage,
} from '@app/common/rbac/guards/user-verified.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user) {
    // Get the user's verification status

    // If payment method is CASH and user is not verified, throw an exception
    if (createOrderDto.paymentMethod === PaymentMethod.CASH && user.isActive) {
      throw new UnauthorizedException(
        'Tài khoản của bạn chưa được xác minh, bạn không thể chọn phương thức thanh toán bằng tiền mặt!',
      );
    }

    // Otherwise, proceed with order creation
    createOrderDto.userId = user.userId;
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
