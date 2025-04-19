import { KafkaProducerService } from '@app/common';
import { CompletionDto } from '@app/common/dto/ai/completion.dto';
import {
  CreateAIModelCommand,
  CreateAIModelDTO,
} from '@app/common/dto/ai/AIModel.dto';
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
    completionDto: CompletionDto,
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
      systemPrompt?: string; // Thêm tùy chọn systemPrompt
    },
  ) {
    try {
      const { prompt, userId } = completionDto;
      // System prompt mặc định hoặc từ options
      const systemPrompt =
        options?.systemPrompt || 'You are a helpful assistant.'; // Ví dụ mặc định
      const fullPrompt = `${systemPrompt}\n\n${prompt}`; // Nối system prompt với user prompt

      const message = {
        prompt: fullPrompt, // Sử dụng fullPrompt thay vì prompt gốc
        userId,
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

  async createAIModel(createAIModelDto: CreateAIModelDTO) {
    try {
      const command: CreateAIModelCommand = {
        data: createAIModelDto,
        metadata: {
          id: `ai-model-${Date.now()}`,
          correlationId: `ai-model-${Date.now()}`,
          timestamp: Date.now(),
          source: 'ai-service',
          type: 'command',
        },
      };
      console.log(
        `Sending create AI model command: ${JSON.stringify(createAIModelDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.aimodel.create',
        command,
      );
      if (response.status === 'error') {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      console.log(`Failed to create AI model: ${error.message}`);
      throw new Error(error);
    }
  }

  async updateAIModel(updateAIModelDto: CreateAIModelDTO) {
    try {
      const command = {
        data: updateAIModelDto,
        metadata: {
          id: `ai-model-${Date.now()}`,
          correlationId: `ai-model-${Date.now()}`,
          timestamp: Date.now(),
          source: 'ai-service',
          type: 'command',
        },
      };
      console.log(
        `Sending update AI model command: ${JSON.stringify(updateAIModelDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.aimodel.update',
        command,
      );
      if (response.status === 'error') {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      console.log(`Failed to update AI model: ${error.message}`);
      throw new Error(error);
    }
  }
}
