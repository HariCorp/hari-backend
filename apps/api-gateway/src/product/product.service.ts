import { CreateProductDto, KafkaProducerService, UpdateProductDto } from '@app/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor(
    private readonly kafkaProducer: KafkaProducerService,
  ) {}
  async create(createProductDto: CreateProductDto, user) {
    createProductDto.userId = user._id;
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.create',
        createProductDto,
      )
      console.log("🔍 ~ create ~ hari-backend/apps/api-gateway/src/product/product.service.ts:11 ~ response:", response)
    } catch (error) {
      throw new Error('Create product failed:', error)
    }
  }

  findAll() {
    return `This action returns all product`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
