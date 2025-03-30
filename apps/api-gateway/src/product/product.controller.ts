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
  ParseArrayPipe,
  DefaultValuePipe,
  Patch,
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
    this.logger.log(`User ${user.username} is creating a product`);
    return this.productService.create(createProductDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findAll(
    // Define all possible query parameters
    @Query('name') name?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minDiscountPercentage') minDiscountPercentage?: number,
    @Query('hasStock') hasStock?: boolean,
    @Query('category') category?: string,
    @Query('tags') tags?: string, // Can be comma-separated
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('desc'))
    sortOrder?: 'asc' | 'desc',
  ) {
    // Construct the filter object with all provided parameters
    const filterDto: FilterProductDto = {
      name,
      brand,
      minPrice,
      maxPrice,
      minDiscountPercentage,
      hasStock,
      category,
      tags: tags ? tags.split(',').map((tag) => tag.trim()) : undefined,
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    };

    // Remove undefined values
    Object.keys(filterDto).forEach((key) => {
      if (filterDto[key] === undefined) {
        delete filterDto[key];
      }
    });

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

  @Get('search/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findByTags(
    @Query(
      'tags',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    tags?: string[],
    @Query() filterDto?: FilterProductDto,
  ) {
    this.logger.log(`Searching products by tags: ${tags?.join(', ')}`);

    // Combine the tags filter with other filters
    const filters = {
      ...filterDto,
      tags,
    };

    return this.productService.findAll(filters);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async search(
    @Query('q') query: string,
    @Query() filterDto: FilterProductDto,
  ) {
    this.logger.log(`Searching products with query: ${query}`);

    // Use the search parameter for full-text search
    const filters = {
      ...filterDto,
      search: query,
    };

    return this.productService.findAll(filters);
  }
  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'product', 'own')
  async toggleActive(@Param('id') id: string, @CurrentUser() user) {
    this.logger.log(
      `User ${user.username} is toggling active status for product ${id}`,
    );
    return this.productService.toggleActive(id, user);
  }
}
