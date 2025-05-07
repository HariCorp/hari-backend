// apps/api-gateway/src/review/review.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { KafkaProducerService } from '@app/common';
import { CreateReviewDto } from '@app/common/dto/review/create-review.dto';
import { UpdateReviewDto } from '@app/common/dto/review/update-review.dto';
import { FilterReviewDto } from '@app/common/dto/review/filter-review.dto';
import { Types } from 'mongoose';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async create(createReviewDto: CreateReviewDto, user: any) {
    createReviewDto.userId = new Types.ObjectId(user.userId);

    const command = {
      data: createReviewDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
        user,
      },
    };

    try {
      this.logger.log(
        `Sending create review command: ${JSON.stringify(createReviewDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.review.create',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to create review',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Create review failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Create review failed: ${error.message}`);
    }
  }

  async findAll(filterDto: FilterReviewDto = {}) {
    try {
      const query = {
        filter: filterDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(
        `Sending find all reviews query with filters: ${JSON.stringify(filterDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.review.findAll',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find reviews',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find reviews failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Find reviews failed: ${error.message}`);
    }
  }

  async findByProductId(productId: string, filterDto: FilterReviewDto = {}) {
    try {
      if (!Types.ObjectId.isValid(productId)) {
        throw new BadRequestException('Invalid product ID format');
      }

      const query = {
        filter: { ...filterDto, productId: new Types.ObjectId(productId) },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(
        `Sending find reviews by product ID query: ${productId}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.review.findByProductId',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find reviews for product',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find reviews by product ID failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(
            `Find reviews by product ID failed: ${error.message}`,
          );
    }
  }

  async findOne(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid review ID format');
      }

      const query = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending find review by ID query: ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.review.findOne',
        query,
      );

      if (response.status === 'error') {
        if (response.error.code === 'NOT_FOUND') {
          throw new NotFoundException(`Review with ID ${id} not found`);
        }
        throw new BadRequestException(
          response.error.message || 'Failed to find review',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find review failed: ${error.message}`);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new BadRequestException(`Find review failed: ${error.message}`);
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid review ID format');
      }

      const command = {
        id,
        data: updateReviewDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(
        `Sending update review command for ID ${id}: ${JSON.stringify(
          updateReviewDto,
        )}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.review.update',
        command,
      );

      if (response.status === 'error') {
        if (response.error.code === 'NOT_FOUND') {
          throw new NotFoundException(`Review with ID ${id} not found`);
        }
        throw new BadRequestException(
          response.error.message || 'Failed to update review',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Update review failed: ${error.message}`);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new BadRequestException(`Update review failed: ${error.message}`);
    }
  }

  async remove(id: string, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid review ID format');
      }

      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(`Sending delete review command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.review.delete',
        command,
      );

      if (response.status === 'error') {
        if (response.error.code === 'NOT_FOUND') {
          throw new NotFoundException(`Review with ID ${id} not found`);
        }
        throw new BadRequestException(
          response.error.message || 'Failed to delete review',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Delete review failed: ${error.message}`);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new BadRequestException(`Delete review failed: ${error.message}`);
    }
  }
}