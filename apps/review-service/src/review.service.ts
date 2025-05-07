// apps/review-service/src/review.service.ts
import { KafkaProducerService, MongoErrorCode } from '@app/common';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './review.schema';
import { DuplicateKeyException } from '@app/common/exceptions/database.exception';
import {
  CreateReviewDto,
  FilterReviewDto,
  UpdateReviewDto,
} from '@app/common/dto/review';

export interface FindAllResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    try {
      const review = await this.reviewModel.create(createReviewDto);

      return review;
    } catch (error) {
      if (error.code === MongoErrorCode.DuplicateKey) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        const duplicateValue = error.keyValue[duplicateField];
        throw new DuplicateKeyException(duplicateField, duplicateValue);
      }
      throw error;
    }
  }

  async findAll(filter: FilterReviewDto = {}): Promise<FindAllResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        productId,
        userId,
        rating,
      } = filter;

      this.logger.log(
        `Finding reviews with filters: ${JSON.stringify(filter)}`,
      );

      const filterQuery: FilterQuery<ReviewDocument> = {};

      if (userId) {
        try {
          filterQuery.userId = new Types.ObjectId(userId.toString());
        } catch (error) {
          throw new BadRequestException(`Invalid user ID format: ${userId}`);
        }
      }

      if (rating) {
        filterQuery.rating = rating;
      }

      const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
      };

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        this.reviewModel
          .find(filterQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.reviewModel.countDocuments(filterQuery).exec(),
      ]);

      // Extract unique user IDs from reviews
      const userIds = [
        ...new Set(reviews.map((review) => review.userId.toString())),
      ];

      // Create a map to store user details by ID for quick lookup
      const userMap = new Map();

      // Process each user ID individually
      for (const userId of userIds) {
        console.log(
          '🔍 ~ findAll ~ hari-backend/apps/review-service/src/review.service.ts:108 ~ userId:',
          userId,
        );

        try {
          const singleUserResponse = await this.kafkaProducer.sendAndReceive<
            any,
            any
          >('ms.user.findById', {
            userId, // Send only one userId
            metadata: {
              id: `review-service-${Date.now()}`,
              correlationId: `review-service-${Date.now()}`,
              timestamp: Date.now(),
              source: 'review-service',
              type: 'query',
            },
          });

          // Add the user details to our map if response is valid
          if (singleUserResponse && singleUserResponse.data) {
            userMap.set(userId, singleUserResponse.data);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch user details for ID ${userId}: ${error.message}`,
          );
          // Continue with other users even if one fails
        }
      }

      // Enrich reviews with user details
      const enrichedReviews = reviews.map((review) => {
        const reviewObj = review.toObject();
        const userInfo = userMap.get(review.userId.toString());

        return {
          ...reviewObj,
          user: userInfo || null,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        reviews: enrichedReviews,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error(`Find all reviews failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Find all reviews failed: ${error.message}`,
      );
    }
  }

  async findByProductId(
    productId: string,
    filter: FilterReviewDto = {},
  ): Promise<FindAllResponse> {
    try {
      if (!Types.ObjectId.isValid(productId)) {
        throw new BadRequestException('Invalid product ID format');
      }

      const updatedFilter = {
        ...filter,
        productId: new Types.ObjectId(productId),
      };

      return this.findAll(updatedFilter);
    } catch (error) {
      this.logger.error(`Find reviews by product ID failed: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid review ID format');
      }

      const review = await this.reviewModel.findById(id).exec();

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      return review;
    } catch (error) {
      this.logger.error(`Find review failed: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid review ID format');
      }

      const review = await this.reviewModel
        .findByIdAndUpdate(id, updateReviewDto, { new: true })
        .exec();

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      // Gửi sự kiện review đã được cập nhật
      await this.kafkaProducer.send('ms.review.updated', {
        reviewId: review._id,
        productId: review.productId,
        userId: review.userId.toString(),
        rating: review.rating,
        updatedFields: Object.keys(updateReviewDto),
      });

      return review;
    } catch (error) {
      this.logger.error(`Update review failed: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid review ID format');
      }

      const review = await this.reviewModel.findByIdAndDelete(id).exec();

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      // Gửi sự kiện review đã bị xóa
      await this.kafkaProducer.send('ms.review.deleted', {
        reviewId: review._id,
        productId: review.productId,
        userId: review.userId.toString(),
      });

      return { id, deleted: true };
    } catch (error) {
      this.logger.error(`Delete review failed: ${error.message}`);
      throw error;
    }
  }
}
