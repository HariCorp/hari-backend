import {
  CreateProductDto,
  FilterProductDto,
  KafkaProducerService,
  MongoErrorCode,
} from '@app/common';
import { ProductCreatedEvent } from '@app/common/dto/product/product-created.event';
import { DuplicateKeyException } from '@app/common/exceptions/database.exception';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Product,
  ProductDocument,
} from 'apps/api-gateway/src/product/schemas/product.schema';
import { FilterQuery, Types } from 'mongoose';
import { Model } from 'mongoose';

export interface FindAllResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class ProductServiceService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      if (typeof createProductDto.userId === 'string') {
        createProductDto.userId = new Types.ObjectId(createProductDto.userId);
      }
      const product = await this.productModel.create(createProductDto);

      await this.kafkaProducer.send(
        'ms.product.created',
        new ProductCreatedEvent(
          product._id,
          product.name,
          product.userId.toString(),
        ),
      );

      return product;
    } catch (error) {
      if (error.code === MongoErrorCode.DuplicateKey) {
        if (error.keyPattern && error.keyPattern.sku) {
          throw new DuplicateKeyException('sku', error.keyValue.sku);
        } else {
          const duplicateField = Object.keys(error.keyPattern)[0];
          const duplicateValue = error.keyValue[duplicateField];
          throw new DuplicateKeyException(duplicateField, duplicateValue);
        }
      }

      throw error;
    }
  }

  async findAll(filter: FilterProductDto = {}): Promise<FindAllResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        name,
        search,
        minPrice,
        maxPrice,
        minDiscountPercentage,
        hasStock,
        category,
        userId,
        closingBefore,
        closingAfter,
        isActive,
      } = filter;
      console.log(
        '[' +
          new Date().toLocaleTimeString() +
          '] 🔍 [hari-backend/apps/product-service/src/product-service.service.ts:60] - ' +
          filter,
      );

      // Build the filter query directly
      const filterQuery: FilterQuery<ProductDocument> = {};

      // Text search (name, description, tags)
      if (search) {
        filterQuery.$text = { $search: search };
      }

      // Name exact match or regex match
      if (name) {
        filterQuery.name = { $regex: name, $options: 'i' };
      }

      // Price range
      if (minPrice !== undefined || maxPrice !== undefined) {
        filterQuery.price = {};
        if (minPrice !== undefined) filterQuery.price.$gte = minPrice;
        if (maxPrice !== undefined) filterQuery.price.$lte = maxPrice;
      }

      // Discount percentage minimum
      if (minDiscountPercentage !== undefined) {
        filterQuery.discountPercentage = { $gte: minDiscountPercentage };
      }

      // Has stock filter
      if (hasStock !== undefined) {
        filterQuery.stock = hasStock ? { $gt: 0 } : { $lte: 0 };
      }

      // Category filter
      if (category) {
        filterQuery.category = new Types.ObjectId(category.toString());
      }

      // User filter
      if (userId) {
        filterQuery.userId = new Types.ObjectId(userId.toString());
      }

      // Closing time range
      if (closingBefore || closingAfter) {
        filterQuery.closingTime = {};
        if (closingBefore) filterQuery.closingTime.$lte = closingBefore;
        if (closingAfter) filterQuery.closingTime.$gte = closingAfter;
      }

      // Active status
      if (isActive !== undefined) {
        filterQuery.isActive = isActive;
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;

      // Create sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute queries in parallel for efficiency
      const [products, total] = await Promise.all([
        this.productModel
          .find(filterQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('category', 'name') // Populate category data
          .populate('userId', 'username email') // Populate user data
          .exec(),
        this.productModel.countDocuments(filterQuery),
      ]);

      const totalPages = Math.ceil(total / limit);
      console.log(`Found ${products.length} products out of ${total} total`);

      return {
        products,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      console.log(`Failed to find products: ${error.message}`);
      throw error;
    }
  }
}
