// apps/api-gateway/src/category/category.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';
import { CreateCategoryDto } from '@app/common/dto/product/create-category.dto';
import { UpdateCategoryDto } from '@app/common/dto/product/update-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    this.logger.log('Creating category');

    const command = {
      data: createCategoryDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };

    const response = await this.kafkaProducer.sendAndReceive(
      'ms.category.create',
      command,
    );

    return response;
  }

  async findAll(query: any) {
    this.logger.log('Finding all categories');

    const kafkaQuery = {
      filter: query,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query',
      },
    };

    const response = await this.kafkaProducer.sendAndReceive(
      'ms.category.findAll',
      kafkaQuery,
    );

    return response;
  }

  async findOne(id: string) {
    this.logger.log(`Finding category with ID: ${id}`);

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

    const response = await this.kafkaProducer.sendAndReceive(
      'ms.category.findById',
      query,
    );

    return response;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    this.logger.log(`Updating category with ID: ${id}`);

    const command = {
      id,
      data: updateCategoryDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };

    const response = await this.kafkaProducer.sendAndReceive(
      'ms.category.update',
      command,
    );

    return response;
  }

  async remove(id: string) {
    this.logger.log(`Deleting category with ID: ${id}`);

    const command = {
      id,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };

    const response = await this.kafkaProducer.sendAndReceive(
      'ms.category.delete',
      command,
    );

    return response;
  }
  async getDirectChildren(parentId?: string) {
    this.logger.log(
      `Getting direct children of category: ${parentId || 'root categories'}`,
    );

    const query = {
      parentId,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query',
      },
    };

    const response = await this.kafkaProducer.sendAndReceive<any, any>(
      'ms.category.getDirectChildren',
      query,
    );

    const data: any = response.data;

    return data;
  }
}
