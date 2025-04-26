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
  Query,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  FilterOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
} from './order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentMethod, RBAC, RolesGuard } from '@app/common';
import { OrderStatus, UserRole } from '@app/common/enums';
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
    // If payment method is CASH and user is not verified, throw an exception
    if (
      createOrderDto.paymentMethod === PaymentMethod.CASH &&
      !user.isVerified
    ) {
      throw new UnauthorizedException(
        'Your account is not verified. You cannot use cash as a payment method.',
      );
    }

    // Set the userId from the authenticated user
    createOrderDto.userId = user.userId;

    return this.orderService.create(createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query() filterDto: FilterOrderDto) {
    return this.orderService.findAll(filterDto);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @RBAC('read', 'order', 'any')
  async findMyOrders(@CurrentUser() user, @Query() filterDto: FilterOrderDto) {
    return this.orderService.findByUser(user.userId, filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user) {
    const order = await this.orderService.findOne(id);

    // Check if the user has permission to view this order
    if (
      user.userId !== order.userId &&
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER].some((role) =>
        user.roles.includes(role),
      )
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user,
  ) {
    const order = await this.orderService.findOne(id);

    // If seller, they can only update their own orders
    if (
      user.roles.includes(UserRole.SELLER) &&
      !user.roles.some((role) =>
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role),
      ) &&
      order.sellerId !== user.userId
    ) {
      throw new ForbiddenException('You can only update your own orders');
    }

    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user,
  ) {
    const order = await this.orderService.findOne(id);

    // If seller, they can only update their own orders
    if (
      user.roles.includes(UserRole.SELLER) &&
      !user.roles.some((role) =>
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role),
      ) &&
      order.sellerId !== user.userId
    ) {
      throw new ForbiddenException('You can only update your own orders');
    }

    return this.orderService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.note,
      user.userId,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @CurrentUser() user,
  ) {
    const order = await this.orderService.findOne(id);

    // Only the user who placed the order or admins can cancel
    if (
      user.userId !== order.userId &&
      !user.roles.some((role) =>
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role),
      )
    ) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Check if the order is already completed or already cancelled
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELED].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel an order with status: ${order.status}`,
      );
    }

    return this.orderService.cancelOrder(
      id,
      cancelOrderDto.reason,
      user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
