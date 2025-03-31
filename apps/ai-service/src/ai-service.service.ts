import { Injectable } from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ApiKey, ApiKeyDocument } from '../schemas/api-key.schema';
import { Model } from 'mongoose';

@Injectable()
export class AiServiceService {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}
  async create(createApiKeyDto: CreateApiKeyDto) {
    console.log(
      '[' +
        new Date().toLocaleTimeString() +
        '] 🔍 [hari-backend/apps/ai-service/src/ai-service.service.ts:12] - ' +
        createApiKeyDto,
    );

    try {
      const apiKey = this.apiKeyModel.create(createApiKeyDto);
      return apiKey;
    } catch (error) {
      console.log(`Failed to create API key: ${error}`);
      throw new Error(error);
    }
  }
}
