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

  // Thêm phương thức getCompletion
  async getCompletion(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
      systemPrompt?: string; // Thêm tùy chọn systemPrompt
    },
  ) {
    try {
      // System prompt mặc định hoặc từ options
      const systemPrompt =
        options?.systemPrompt || 'You are a helpful assistant.'; // Ví dụ mặc định
      const fullPrompt = `${systemPrompt}\n\n${prompt}`; // Nối system prompt với user prompt

      const message = {
        prompt: fullPrompt, // Sử dụng fullPrompt thay vì prompt gốc
        options,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      console.log(
        `Sending getCompletion request with prompt: ${fullPrompt.substring(0, 50)}...`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.ai.getCompletion',
        message,
        30000, // Increased timeout for AI requests (30 seconds)
      );

      if (response.status === 'error') {
        console.log(`Completion error: ${response.error.message}`);
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.log(`Failed to get completion: ${error.message}`);
      throw new Error(`AI completion failed: ${error.message}`);
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
