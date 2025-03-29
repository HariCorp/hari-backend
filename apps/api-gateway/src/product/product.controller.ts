// apps/api-gateway/src/product/product.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto,
} from '@app/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '@app/common/rbac/guards/roles.guard';
import { RBAC } from '@app/common/rbac/decorators/rbac.decorator';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'product', 'own')
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user,
  ) {
    console.log(
      '[' +
        new Date().toLocaleTimeString() +
        '] 🔍 [hari-backend/apps/api-gateway/src/product/product.controller.ts:19] - ' +
        createProductDto,
    );

    this.logger.log(`User ${user.username} is creating a product`);
    return this.productService.create(createProductDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findAll(@Query() filterDto: FilterProductDto) {
    this.logger.log(
      `Getting all products with filters: ${JSON.stringify(filterDto)}`,
    );
    return this.productService.findAll(filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Getting product with ID: ${id}`);
    const product = await this.productService.findOne(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'product', 'own')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user,
  ) {
    this.logger.log(`User ${user.username} is updating product ${id}`);
    return this.productService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'product', 'own')
  async remove(@Param('id') id: string, @CurrentUser() user) {
    this.logger.log(`User ${user.username} is deleting product ${id}`);
    return this.productService.remove(id, user);
  }

  @Get('category/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() filterDto: FilterProductDto,
  ) {
    this.logger.log(`Getting products for category: ${categoryId}`);

    // Combine the category filter with other filters
    const filters = {
      ...filterDto,
      category: categoryId,
    };

    return this.productService.findAll(filters);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findByUser(
    @Param('userId') userId: string,
    @Query() filterDto: FilterProductDto,
  ) {
    this.logger.log(`Getting products for user: ${userId}`);

    // Combine the user filter with other filters
    const filters = {
      ...filterDto,
      userId: userId,
    };

    return this.productService.findAll(filters);
  }
}
