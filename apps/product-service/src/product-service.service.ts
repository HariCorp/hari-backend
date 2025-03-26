import { CreateProductDto, KafkaProducerService } from '@app/common';
import { ProductCreatedEvent } from '@app/common/dto/product/product-created.event';
import { DuplicateKeyException } from '@app/common/exceptions/database.exception';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from 'apps/api-gateway/src/product/schemas/product.schema';
import { Model } from 'mongoose';

@Injectable()
export class ProductServiceService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly kafkaProducer: KafkaProducerService
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.productModel.create(createProductDto);
      
      await this.kafkaProducer.send('ms.product.created', new ProductCreatedEvent(
        product._id,
        product.name,
        product.userId.toString(),
      ));
      
      return product;
    } catch (error) {
      if (error.code === 11000) {
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
}
