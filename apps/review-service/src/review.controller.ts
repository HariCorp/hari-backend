// apps/review-service/src/review.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto } from '@app/common/dto/review';

@Controller()
export class ReviewController {
  private readonly logger = new Logger(ReviewController.name);

  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern('ms.review.create')
  async createReview(command: { data: CreateReviewDto }) {
    try {
      const review = await this.reviewService.create(command.data);
      return { status: 'success', data: review };
    } catch (error) {
      this.logger.error(`Failed to create review: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'CREATE_REVIEW_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.review.findAll')
  async findAll(command) {
    try {
      const filter = command.filter;
      const response = await this.reviewService.findAll(filter);
      return { status: 'success', data: response };
    } catch (error) {
      this.logger.error(`Find all reviews failed: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_ALL_REVIEWS_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.review.findByProductId')
  async findByProductId(command) {
    try {
      const productId = command.filter.productId;
      const filter = command.filter;
      const response = await this.reviewService.findByProductId(
        productId,
        filter,
      );
      return { status: 'success', data: response };
    } catch (error) {
      this.logger.error(`Find reviews by product ID failed: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_REVIEWS_BY_PRODUCT_ID_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.review.findOne')
  async findOne(command) {
    try {
      const reviewId = command.id;
      const review = await this.reviewService.findOne(reviewId);
      return { status: 'success', data: review };
    } catch (error) {
      this.logger.error(`Failed to find review by ID: ${error.message}`);
      return {
        status: 'error',
        error: {
          code:
            error.name === 'NotFoundException'
              ? 'NOT_FOUND'
              : error.name || 'FIND_REVIEW_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.review.update')
  async update(command: { id: string; data: UpdateReviewDto }) {
    try {
      const review = await this.reviewService.update(command.id, command.data);
      return { status: 'success', data: review };
    } catch (error) {
      this.logger.error(`Failed to update review: ${error.message}`);
      return {
        status: 'error',
        error: {
          code:
            error.name === 'NotFoundException'
              ? 'NOT_FOUND'
              : error.name || 'UPDATE_REVIEW_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.review.delete')
  async delete(command: { id: string }) {
    try {
      const result = await this.reviewService.remove(command.id);
      return { status: 'success', data: result };
    } catch (error) {
      this.logger.error(`Failed to delete review: ${error.message}`);
      return {
        status: 'error',
        error: {
          code:
            error.name === 'NotFoundException'
              ? 'NOT_FOUND'
              : error.name || 'DELETE_REVIEW_ERROR',
          message: error.message,
        },
      };
    }
  }
}
