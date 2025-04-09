// apps/api-gateway/src/cart/cart.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
  FilterCartDto,
} from '@app/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '@app/common/rbac/guards/roles.guard';
import { RBAC } from '@app/common/rbac/decorators/rbac.decorator';

@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'cart-item', 'own')
  async addToCart(
    @Body() createCartItemDto: CreateCartItemDto,
    @CurrentUser() user,
  ) {
    this.logger.log(`User ${user.username} is adding item to cart`);
    return this.cartService.addToCart(createCartItemDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'cart-item', 'own')
  async findUserCart(
    @CurrentUser() user,
    @Query() filterDto: FilterCartDto,
  ) {
    this.logger.log(`Getting cart for user: ${user.userId}`);
    return this.cartService.findUserCart(user.userId, filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'cart-item', 'own')
  async findOne(@Param('id') id: string, @CurrentUser() user) {
    this.logger.log(`Getting cart item with ID: ${id}`);
    const cartItem = await this.cartService.findCartItem(id, user);

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    return cartItem;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'cart-item', 'own')
  async update(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user,
  ) {
    this.logger.log(`User ${user.username} is updating cart item ${id}`);
    return this.cartService.updateCartItem(id, updateCartItemDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'cart-item', 'own')
  async remove(@Param('id') id: string, @CurrentUser() user) {
    this.logger.log(`User ${user.username} is removing cart item ${id}`);
    return this.cartService.removeCartItem(id, user);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'cart-item', 'own')
  async clearCart(@CurrentUser() user) {
    this.logger.log(`User ${user.username} is clearing their cart`);
    return this.cartService.clearCart(user);
  }
}