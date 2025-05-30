// apps/api-gateway/src/category/category.controller.ts
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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/rbac/guards/roles.guard';
import { RBAC } from '@app/common/rbac/decorators/rbac.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from '@app/common/dto/product/create-category.dto';
import { UpdateCategoryDto } from '@app/common/dto/product/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('leaf')
  async getLeafCategories() {
    return this.categoryService.getLeafCategories();
  }
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'category')
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.categoryService.findAll(query);
  }

  @Get('root/children')
  async getRootCategories() {
    return this.categoryService.getDirectChildren();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'category')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'category')
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Get('children/:parentId')
  async getDirectChildren(@Param('parentId') parentId?: string) {
    return this.categoryService.getDirectChildren(parentId);
  }
}
