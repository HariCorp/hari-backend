// apps/api-gateway/src/api-gateway.controller.ts
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
  Req,
  Res,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  LoginDto,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  CompletionDto,
} from '@app/common/dto';
import { RolesGuard } from '@app/common/rbac/guards/roles.guard';
import { RBAC } from '@app/common/rbac/decorators/rbac.decorator';
import { Request, Response } from 'express';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtRefreshAuthGuard,
  Public,
} from '@app/common';

@Controller()
export class ApiGatewayController {
  private readonly logger = new Logger(ApiGatewayController.name);

  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  // User endpoints
  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.apiGatewayService.createUser(createUserDto);
  }

  @Get('users')
  async findAllUsers(@Query() filterDto: FilterUserDto) {
    return this.apiGatewayService.findAllUsers(filterDto);
  }

  @Get('users/:id')
  async findUserById(@Param('id') id: string) {
    return this.apiGatewayService.findUserById(id);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.apiGatewayService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.apiGatewayService.deleteUser(id);
  }

  @Public()
  @Post('users/authenticate')
  async authenticate(
    @Body() credentials: { username: string; password: string },
  ) {
    return this.apiGatewayService.authenticate(
      credentials.username,
      credentials.password,
    );
  }

  // Auth endpoints
  @Public()
  @Post('auth/login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.apiGatewayService.login(loginDto, res);
  }

  @Public()
  @Post('auth/register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.apiGatewayService.register(createUserDto);
  }

  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.apiGatewayService.logout(req, res);
  }

  @Post('auth/refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.apiGatewayService.refresh(req, res);
  }

  @Get('auth/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user) {
    return this.apiGatewayService.getProfile(user.userId);
  }

  // Product endpoints
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'product', 'own')
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user,
  ) {
    return this.apiGatewayService.createProduct(createProductDto, user);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findAllProducts(
    @Query('name') name?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minDiscountPercentage') minDiscountPercentage?: number,
    @Query('hasStock') hasStock?: boolean,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('desc'))
    sortOrder?: 'asc' | 'desc',
  ) {
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

    Object.keys(filterDto).forEach((key) => {
      if (filterDto[key] === undefined) {
        delete filterDto[key];
      }
    });

    return this.apiGatewayService.findAllProducts(filterDto);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findOneProduct(@Param('id') id: string) {
    return this.apiGatewayService.findOneProduct(id);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'product', 'own')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user,
  ) {
    return this.apiGatewayService.updateProduct(id, updateProductDto, user);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'product', 'own')
  async removeProduct(@Param('id') id: string, @CurrentUser() user) {
    return this.apiGatewayService.removeProduct(id, user);
  }

  @Get('products/category/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() filterDto: FilterProductDto,
  ) {
    return this.apiGatewayService.findProductsByCategory(categoryId, filterDto);
  }

  @Get('products/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async findByUser(
    @Param('userId') userId: string,
    @Query() filterDto: FilterProductDto,
  ) {
    return this.apiGatewayService.findProductsByUser(userId, filterDto);
  }

  @Get('products/search/tags')
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
    return this.apiGatewayService.findProductsByTags(
      tags || [],
      filterDto || {},
    );
  }

  @Get('products/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'product')
  async searchProducts(
    @Query('q') query: string,
    @Query() filterDto: FilterProductDto,
  ) {
    return this.apiGatewayService.searchProducts(query, filterDto);
  }

  @Patch('products/:id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'product', 'own')
  async toggleProductActive(@Param('id') id: string, @CurrentUser() user) {
    return this.apiGatewayService.toggleProductActive(id, user);
  }

  // Category endpoints
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'category')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.apiGatewayService.createCategory(createCategoryDto);
  }

  @Get('categories')
  async findAllCategories(@Query() query: any) {
    return this.apiGatewayService.findAllCategories(query);
  }

  @Get('categories/root/children')
  async getRootCategories() {
    return this.apiGatewayService.getRootCategories();
  }

  @Get('categories/:id')
  async findOneCategory(@Param('id') id: string) {
    return this.apiGatewayService.findOneCategory(id);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'category')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.apiGatewayService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'category')
  async removeCategory(@Param('id') id: string) {
    return this.apiGatewayService.removeCategory(id);
  }

  @Get('categories/children/:parentId')
  async getDirectChildren(@Param('parentId') parentId?: string) {
    return this.apiGatewayService.getDirectChildren(parentId);
  }

  // AI endpoints
  @Post('ai')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'apiKey', 'any')
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiGatewayService.createApiKey(createApiKeyDto);
  }

  @Get('ai')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'apiKey', 'any')
  async findAllApiKeys() {
    return this.apiGatewayService.findAllApiKeys();
  }

  @Get('ai/:id')
  async findOneApiKey(@Param('id') id: string) {
    return this.apiGatewayService.findOneApiKey(id);
  }

  @Put('ai/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'apiKey', 'any')
  async updateApiKey(
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return this.apiGatewayService.updateApiKey(id, updateApiKeyDto);
  }

  @Post('ai/completion')
  @UseGuards(JwtAuthGuard)
  async createCompletion(@Body() completionDto: CompletionDto) {
    return this.apiGatewayService.createCompletion(completionDto);
  }
}
