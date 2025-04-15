// apps/product-service/src/product-service.service.ts
import {
  CreateProductDto,
  FilterProductDto,
  KafkaProducerService,
  MongoErrorCode,
  UpdateProductDto,
} from '@app/common';
import { ProductCreatedEvent } from '@app/common/dto/product/product-created.event';
import { DuplicateKeyException } from '@app/common/exceptions/database.exception';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  private readonly logger = new Logger(ProductServiceService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
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
        brand,
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
        tags,
      } = filter;

      this.logger.log(
        `Finding products with filters: ${JSON.stringify(filter)}`,
      );

      const filterQuery: FilterQuery<ProductDocument> = {};

      if (search) {
        filterQuery.$text = { $search: search };
      }
      if (name) {
        filterQuery.name = { $regex: name, $options: 'i' };
      }
      if (brand) {
        filterQuery.brand = { $regex: brand, $options: 'i' };
      }
      if (tags) {
        if (Array.isArray(tags)) {
          filterQuery.tags = { $in: tags.map((tag) => new RegExp(tag, 'i')) };
        } else {
          filterQuery.tags = { $regex: tags, $options: 'i' };
        }
      }
      // if (minPrice !== undefined || maxPrice !== undefined) {
      //   filterQuery.price = {};
      //   if (minPrice !== undefined) filterQuery.price.$gte = Number(minPrice);
      //   if (maxPrice !== undefined) filterQuery.price.$lte = Number(maxPrice);
      // }
      // if (minDiscountPercentage !== undefined) {
      //   filterQuery.discountPercentage = {
      //     $gte: Number(minDiscountPercentage),
      //   };
      // }
      if (hasStock !== undefined) {
        filterQuery.stock = hasStock ? { $gt: 0 } : { $gte: 0 };
      }
      if (category) {
        filterQuery.category = new Types.ObjectId(category.toString());
      }
      if (userId) {
        filterQuery.userId = userId.toString();
      }
      if (closingBefore || closingAfter) {
        filterQuery.closingTime = {};
        if (closingBefore)
          filterQuery.closingTime.$lte = new Date(closingBefore);
        if (closingAfter) filterQuery.closingTime.$gte = new Date(closingAfter);
      }
      if (isActive !== undefined) {
        filterQuery.isActive = isActive;
      }

      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      this.logger.debug(`Filter query: ${JSON.stringify(filterQuery)}`);
      this.logger.debug(
        `Sort: ${JSON.stringify(sort)}, Skip: ${skip}, Limit: ${limit}`,
      );

      const [products, total] = await Promise.all([
        this.productModel
          .find(filterQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('category', 'name description slug')
          .populate('userId', 'username email')
          .exec(),
        this.productModel.countDocuments(filterQuery),
      ]);

      const totalPages = Math.ceil(total / limit);
      this.logger.log(
        `Found ${products.length} products out of ${total} total`,
      );

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
      this.logger.error(
        `Failed to find products: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(productId: string) {
    try {
      const product = await this.productModel
        .findById(productId)
        .populate('category', 'name')
        .exec();
      if (!product) {
        throw new NotFoundException(`Product not found with id: ${productId}`);
      }
      return product;
    } catch (error) {
      throw error;
    }
  }

  async update(productId: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productModel
        .findByIdAndUpdate(productId, updateProductDto, {
          new: true,
          runValidators: true,
        })
        .populate('category', 'name')
        .exec();

      if (!product) {
        throw new NotFoundException(`Product not found with id: ${productId}`);
      }

      return product;
    } catch (error) {
      if (error.code === MongoErrorCode.DuplicateKey) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        const duplicateValue = error.keyValue[duplicateField];
        throw new DuplicateKeyException(duplicateField, duplicateValue);
      }
      throw error;
    }
  }

  async remove(productId: string) {
    try {
      const product = await this.productModel
        .findByIdAndDelete(productId)
        .exec();

      if (!product) {
        throw new NotFoundException(`Product not found with id: ${productId}`);
      }

      return { message: 'Product deleted successfully', product };
    } catch (error) {
      throw error;
    }
  }

  async toggleActive(productId: string): Promise<Product> {
    try {
      const product = await this.findOne(productId); // Tái sử dụng findOne để kiểm tra tồn tại
      product.isActive = !product.isActive; // Đổi trạng thái isActive
      await product.save(); // Lưu thay đổi
      this.logger.log(
        `Toggled active status of product ${productId} to ${product.isActive}`,
      );
      return product;
    } catch (error) {
      this.logger.error(
        `Failed to toggle active status of product ${productId}: ${error.message}`,
      );
      throw error; // Ném lỗi để controller xử lý
    }
  }

  async findByIds(productIds: string[]) {
    try {
      const products = await this.productModel
        .find({
          _id: { $in: productIds.map(id => new Types.ObjectId(id)) }
        })
        .populate('category', 'name')
        .exec();

      return products;
    } catch (error) {
      this.logger.error(
        `Failed to find products by IDs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
