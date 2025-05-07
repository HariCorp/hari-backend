// apps/api-gateway/src/review/review.controller.ts
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
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from '@app/common/dto/review/create-review.dto';
import { UpdateReviewDto } from '@app/common/dto/review/update-review.dto';
import { FilterReviewDto } from '@app/common/dto/review/filter-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '@app/common/rbac/guards/roles.guard';
import { RBAC } from '@app/common/rbac/decorators/rbac.decorator';

@Controller('reviews')
export class ReviewController {
  private readonly logger = new Logger(ReviewController.name);

  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'review', 'own')
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user,
  ) {
    this.logger.log(`User ${user.username} is creating a review`);
    return this.reviewService.create(createReviewDto, user);
  }

  @Get()
  async findAll(@Query() filterDto: FilterReviewDto) {
    return this.reviewService.findAll(filterDto);
  }

  @Get('product/:productId')
  async findByProductId(
    @Param('productId') productId: string,
    @Query() filterDto: FilterReviewDto,
  ) {
    return this.reviewService.findByProductId(productId, filterDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'review', 'own')
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user,
  ) {
    return this.reviewService.update(id, updateReviewDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'review', 'own')
  async remove(@Param('id') id: string, @CurrentUser() user) {
    return this.reviewService.remove(id, user);
  }
}