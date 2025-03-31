import { Controller, Get } from '@nestjs/common';
import { AiServiceService } from './ai-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateApiKeyCommand } from '../dto/create-api-key.dto';

@Controller()
export class AiServiceController {
  constructor(private readonly aiServiceService: AiServiceService) {}

  @MessagePattern('ms.apiKey.create')
  async createApiKey(command: CreateApiKeyCommand) {
    console.log(
      '[' +
        new Date().toLocaleTimeString() +
        '] 🔍 [hari-backend/apps/ai-service/src/ai-service.controller.ts:11] - ' +
        JSON.stringify(command),
    );

    try {
      const apiKey = await this.aiServiceService.create(command.data);
      return { status: 'succcess', data: apiKey };
    } catch (error) {
      console.log(`Failed to create api key: ${error.message}`);
      return { status: 'error', error: { message: error.message } };
    }
  }
}
