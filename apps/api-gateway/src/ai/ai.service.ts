import { KafkaProducerService } from '@app/common';
import { Injectable } from '@nestjs/common';
import {
  CreateApiKeyCommand,
  CreateApiKeyDto,
} from 'apps/ai-service/dto/create-api-key.dto';
import { UpdateApiKeyDto } from 'apps/ai-service/dto/update-api-key.dto';

@Injectable()
export class AiService {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}
  async create(createApiKeyDto: CreateApiKeyDto) {
    const command = {
      data: createApiKeyDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'ai-service',
        type: 'command',
      },
    };
    try {
      console.log(
        `Sending create apiKeys command: ${JSON.stringify(createApiKeyDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.apiKey.create',
        command,
      );

      if (response.status === 'error') {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.log(`Failed to create api key: ${error.message}`);
      throw new Error(error);
    }
  }

  findAll() {
    return `This action returns all ai`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ai`;
  }

  update(id: number, updateAiDto: UpdateApiKeyDto) {
    return `This action updates a #${id} ai`;
  }

  remove(id: number) {
    return `This action removes a #${id} ai`;
  }
}
