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
  Logger,
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

@Controller('order')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order
   * Requires authentication and verified account for cash payment
   */
  @Post()
  @RBAC('create', 'order', 'own')
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user) {
    this.logger.log(`User ${user.username} is creating a new order`);

    // If payment method is CASH and user is not verified, throw an exception
    if (
      createOrderDto.paymentMethod === PaymentMethod.CASH &&
      !user.isVerified
    ) {
      throw new UnauthorizedException(
        'Your account must be verified to use cash as a payment method',
      );
    }

    // Set the userId from the authenticated user
    createOrderDto.userId = user.userId;
    return this.orderService.create(createOrderDto);
  }

  /**
   * Find all orders - Admin access only
   */
  @Get()
  @RBAC('read', 'order', 'any')
  async findAll(@Query() filterDto: FilterOrderDto, @CurrentUser() user) {
    this.logger.log(`Admin ${user.username} getting all orders with filters`);
    return this.orderService.findAll(filterDto);
  }

  /**
   * Get orders for the current user
   */
  @Get('my-orders')
  @RBAC('read', 'order', 'own')
  async findMyOrders(@CurrentUser() user, @Query() filterDto: FilterOrderDto) {
    this.logger.log(`User ${user.username} getting their orders`);
    return this.orderService.findByUser(user.userId, filterDto);
  }

  /**
   * Get seller orders
   */
  @Get('seller-orders')
  @RBAC('read', 'order', 'own')
  async findSellerOrders(
    @CurrentUser() user,
    @Query() filterDto: FilterOrderDto,
  ) {
    this.logger.log(`Seller ${user.username} getting their sales orders`);

    // Verify user has seller role
    if (!user.roles.includes(UserRole.SELLER)) {
      throw new ForbiddenException('Only sellers can access seller orders');
    }

    // Add seller ID to filter
    const sellerFilter = {
      ...filterDto,
      sellerId: user.userId,
    };

    return this.orderService.findAll(sellerFilter);
  }

  /**
   * Get a specific order by ID
   */
  @Get(':id')
  @RBAC('read', 'order', 'own')
  async findOne(@Param('id') id: string, @CurrentUser() user) {
    this.logger.log(`Getting order with ID: ${id} for user: ${user.username}`);
    const order = await this.orderService.findOne(id);

    // Check if the user has permission to view this order
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].some((role) =>
      user.roles.includes(role),
    );
    const isSeller =
      user.roles.includes(UserRole.SELLER) && order.sellerId === user.userId;
    const isOrderOwner = order.userId === user.userId;

    if (!isAdmin && !isSeller && !isOrderOwner) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  /**
   * Update an order - Admin or seller of the order
   */
  @Patch(':id')
  @RBAC('update', 'order', 'own')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user,
  ) {
    this.logger.log(`User ${user.username} updating order ${id}`);
    const order = await this.orderService.findOne(id);

    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].some((role) =>
      user.roles.includes(role),
    );
    const isSeller =
      user.roles.includes(UserRole.SELLER) && order.sellerId === user.userId;

    if (!isAdmin && !isSeller) {
      throw new ForbiddenException(
        'You can only update orders you are selling',
      );
    }

    return this.orderService.update(id, updateOrderDto);
  }

  /**
   * Update order status - Admin or seller of the order
   */
  @Patch(':id/status')
  @RBAC('update', 'order', 'own')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user,
  ) {
    this.logger.log(
      `User ${user.username} updating status of order ${id} to ${updateStatusDto.status}`,
    );
    const order = await this.orderService.findOne(id);

    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].some((role) =>
      user.roles.includes(role),
    );
    const isSeller =
      user.roles.includes(UserRole.SELLER) && order.sellerId === user.userId;

    if (!isAdmin && !isSeller) {
      throw new ForbiddenException(
        'You can only update orders you are selling',
      );
    }

    return this.orderService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.note,
      user.userId,
    );
  }

  /**
   * Cancel an order - Admin, seller, or order owner
   */
  @Patch(':id/cancel')
  @RBAC('update', 'order', 'own')
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @CurrentUser() user,
  ) {
    this.logger.log(`User ${user.username} cancelling order ${id}`);
    const order = await this.orderService.findOne(id);

    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].some((role) =>
      user.roles.includes(role),
    );
    const isSeller =
      user.roles.includes(UserRole.SELLER) && order.sellerId === user.userId;
    const isOrderOwner = order.userId === user.userId;

    if (!isAdmin && !isSeller && !isOrderOwner) {
      throw new ForbiddenException(
        'You do not have permission to cancel this order',
      );
    }

    // Check if the order can be cancelled
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

  /**
   * Delete an order - Admin only
   */
  @Delete(':id')
  @RBAC('delete', 'order', 'any')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user) {
    this.logger.log(`Admin ${user.username} deleting order ${id}`);
    return this.orderService.remove(id);
  }
}
