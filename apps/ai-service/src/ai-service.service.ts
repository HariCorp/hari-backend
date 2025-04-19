import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Prompt, PromptDocument } from '../schemas/prompt.schema';
import {
  CreateAIModelDTO,
  UpdateAIModelDTO,
} from '@app/common/dto/ai/AIModel.dto';
import { AIModel, AIModelDocument } from '../schemas/ai-model.schema';
import { ApiKey, ApiKeyDocument } from '../schemas/api-key.schema';
import { ApiKeyStatus, ApiKeyType } from '@app/common';

@Injectable()
export class AiServiceService {
  private readonly logger = new Logger(AiServiceService.name);

  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(Prompt.name) private promptModel: Model<PromptDocument>,
    @InjectModel(AIModel.name) private aiModel: Model<AIModelDocument>,
  ) {}

  /**
   * Tạo một API key mới dựa trên DTO được cung cấp
   * @param createApiKeyDto Dữ liệu để tạo API key
   * @returns API key đã được tạo
   */
  async create(createApiKeyDto: CreateApiKeyDto): Promise<ApiKeyDocument> {
    this.logger.log(`Đang tạo API key: ${createApiKeyDto.name}`);
    try {
      const apiKey = await this.apiKeyModel.create(createApiKeyDto);
      this.logger.log(`Đã tạo API key thành công: ${apiKey._id}`);
      return apiKey;
    } catch (error) {
      this.logger.error(`Không thể tạo API key: ${error.message}`);
      throw new Error(`Không thể tạo API key: ${error.message}`);
    }
  }

  /**
   * Tìm API key có số lượng gọi hàng ngày thấp nhất
   * @param type Loại API key (mặc định là GEMINI)
   * @returns API key với số lượng gọi thấp nhất hoặc null nếu không tìm thấy
   */
  async getApiKeyWithLowestDailyCalls(
    userId: string,
    type: ApiKeyType = ApiKeyType.GEMINI,
  ): Promise<ApiKeyDocument | null> {
    this.logger.log(`Tìm API key với số lượng gọi thấp nhất, loại: ${type}`);
    try {
      const query = {
        type,
        status: ApiKeyStatus.ACTIVE,
        userId,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      };

      const apiKey = await this.apiKeyModel
        .findOne(query)
        .sort({ dailyCalls: 1 })
        .exec();

      if (!apiKey) {
        this.logger.warn(
          `Không tìm thấy API key hoạt động nào cho loại ${type}`,
        );
      } else {
        this.logger.log(
          `Tìm thấy API key: ${apiKey.name} với ${apiKey.dailyCalls} gọi/ngày`,
        );
      }

      return apiKey;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm API key: ${error.message}`);
      throw new Error(`Lỗi khi lấy API key: ${error.message}`);
    }
  }

  /**
   * Gửi yêu cầu hoàn thành văn bản tới Gemini API
   * @param prompt Câu lệnh đầu vào
   * @param options Tùy chọn cấu hình (maxTokens, temperature, model)
   * @returns Phản hồi từ Gemini API với nội dung và thông tin sử dụng token
   */
  async getCompletion(
    prompt: string,
    userId,
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
  ): Promise<{
    content: string;
    tokenUsage: { input: number; output: number; total: number };
    model: string;
    provider: ApiKeyType;
  }> {
    this.logger.log(`Yêu cầu hoàn thành từ Gemini với prompt: "${prompt}"`);
    try {
      const {
        maxTokens = 1000,
        temperature = 0.7,
        model = 'gemini-2.5-pro-exp-03-25', // Model mặc định của Gemini
      } = options || {};

      const apiKey = await this.getApiKeyWithLowestDailyCalls(userId);
      if (!apiKey) {
        this.logger.error('Không tìm thấy API key Gemini nào hoạt động');
        throw new NotFoundException('Không tìm thấy API key Gemini hoạt động');
      }

      this.logger.log(
        `Sử dụng API key: ${apiKey.name} (${apiKey.dailyCalls} gọi/ngày)`,
      );

      const genAI = new GoogleGenerativeAI(apiKey.key);
      const geminiModel = genAI.getGenerativeModel({ model });

      const generationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 40,
      };

      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      this.logger.debug(`Phản hồi từ Gemini: ${JSON.stringify(result)}`);

      // Trích xuất nội dung từ phản hồi
      let content = '';
      if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        content = result.response.candidates[0].content.parts[0].text;
      } else {
        this.logger.warn('Cấu trúc phản hồi không như mong đợi');
        content = '';
      }

      // Trích xuất thông tin token usage
      let tokenUsage = {
        input: 0,
        output: 0,
        total: 0,
      };
      const metadata = result.response?.usageMetadata;
      if (metadata) {
        tokenUsage = {
          input: metadata.promptTokenCount || 0,
          output: metadata.candidatesTokenCount || 0,
          total: metadata.totalTokenCount || 0,
        };
      } else {
        this.logger.warn('Không có metadata token, sử dụng ước lượng');
        tokenUsage = {
          input: this.estimateTokenCount(prompt),
          output: this.estimateTokenCount(content),
          total:
            this.estimateTokenCount(prompt) + this.estimateTokenCount(content),
        };
      }

      // Cập nhật thống kê sử dụng API key
      await this.updateApiKeyUsage(apiKey._id, tokenUsage.total);

      const response = {
        content,
        tokenUsage,
        model,
        provider: ApiKeyType.GEMINI,
      };

      this.logger.log(`Hoàn thành thành công: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.logger.error(`Lỗi khi gọi Gemini API: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Lỗi Gemini API: ${error.message}`);
    }
  }

  /**
   * Cập nhật thống kê sử dụng của API key
   * @param apiKeyId ID của API key cần cập nhật
   * @param tokenCount Số token đã sử dụng
   */
  private async updateApiKeyUsage(
    apiKeyId: any,
    tokenCount: number,
  ): Promise<void> {
    try {
      const safeTokenCount = isNaN(tokenCount) ? 0 : tokenCount;
      this.logger.log(
        `Cập nhật thống kê cho API key ${apiKeyId}: +1 gọi, +${safeTokenCount} token`,
      );

      const now = new Date();
      const updatedApiKey = await this.apiKeyModel.findByIdAndUpdate(
        apiKeyId,
        {
          $inc: {
            totalCalls: 1,
            dailyCalls: 1,
            totalTokensUsed: safeTokenCount,
            dailyTokensUsed: safeTokenCount,
            currentMinuteCalls: 1,
          },
          lastCallAt: now,
        },
        { new: true },
      );

      if (!updatedApiKey) {
        this.logger.warn(`Không tìm thấy API key với ID: ${apiKeyId}`);
        return;
      }

      // Reset daily counters nếu cần
      if (!updatedApiKey.dailyResetAt || now > updatedApiKey.dailyResetAt) {
        await this.apiKeyModel.findByIdAndUpdate(apiKeyId, {
          dailyCalls: 1,
          dailyTokensUsed: safeTokenCount,
          dailyResetAt: this.getTomorrowMidnight(),
        });
      }

      // Reset minute counters nếu cần
      if (!updatedApiKey.minuteResetAt || now > updatedApiKey.minuteResetAt) {
        await this.apiKeyModel.findByIdAndUpdate(apiKeyId, {
          currentMinuteCalls: 1,
          minuteResetAt: this.getNextMinute(),
        });
      }

      this.logger.log(
        `Đã cập nhật thành công thống kê cho API key ${apiKeyId}`,
      );
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật thống kê API key: ${error.message}`);
    }
  }
  async createPromptSchema(
    createPromptSchemaDto: any,
  ): Promise<PromptDocument> {
    this.logger.log(`Creating prompt schema: ${createPromptSchemaDto.name}`);
    try {
      const promptSchema = await this.promptModel.create({
        ...createPromptSchemaDto,
        lastUpdated: new Date(),
      });

      this.logger.log(
        `Successfully created prompt schema: ${promptSchema._id}`,
      );
      return promptSchema;
    } catch (error) {
      this.logger.error(`Failed to create prompt schema: ${error.message}`);
      throw new Error(`Failed to create prompt schema: ${error.message}`);
    }
  }

  async findAllPromptSchemas(
    filter: any = {},
  ): Promise<{ promptSchemas: PromptDocument[]; total: number }> {
    try {
      const query: any = {};

      if (filter.name) {
        query.name = { $regex: filter.name, $options: 'i' };
      }

      const [promptSchemas, total] = await Promise.all([
        this.promptModel.find(query).sort({ lastUpdated: -1 }).exec(),
        this.promptModel.countDocuments(query),
      ]);

      return { promptSchemas, total };
    } catch (error) {
      this.logger.error(`Failed to fetch prompt schemas: ${error.message}`);
      throw new Error(`Failed to fetch prompt schemas: ${error.message}`);
    }
  }

  async findPromptSchemaById(id: string): Promise<PromptDocument> {
    try {
      const promptSchema = await this.promptModel.findById(id).exec();

      if (!promptSchema) {
        throw new NotFoundException(`Prompt schema with ID ${id} not found`);
      }

      return promptSchema;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch prompt schema: ${error.message}`);
      throw new Error(`Failed to fetch prompt schema: ${error.message}`);
    }
  }

  async updatePromptSchema(
    id: string,
    updatePromptSchemaDto: any,
  ): Promise<PromptDocument> {
    try {
      const updatedPromptSchema = await this.promptModel
        .findByIdAndUpdate(
          id,
          {
            ...updatePromptSchemaDto,
            lastUpdated: new Date(),
          },
          { new: true },
        )
        .exec();

      if (!updatedPromptSchema) {
        throw new NotFoundException(`Prompt schema with ID ${id} not found`);
      }

      return updatedPromptSchema;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update prompt schema: ${error.message}`);
      throw new Error(`Failed to update prompt schema: ${error.message}`);
    }
  }

  async updateTimeMetrics(
    id: string,
    timeField: string,
    metricsData: any,
  ): Promise<PromptDocument> {
    try {
      // Kiểm tra xem timeField có phải là một trong các trường thời gian hợp lệ không
      const validTimeFields = [
        'todayInfo',
        'yesterdayInfo',
        'weekInfo',
        'monthInfo',
      ];
      if (!validTimeFields.includes(timeField)) {
        throw new Error(`Invalid time field: ${timeField}`);
      }

      // Tạo đối tượng cập nhật
      const updateObj: any = {};
      updateObj[timeField] = metricsData;
      updateObj.lastUpdated = new Date();

      const updatedPromptSchema = await this.promptModel
        .findByIdAndUpdate(id, { $set: updateObj }, { new: true })
        .exec();

      if (!updatedPromptSchema) {
        throw new NotFoundException(`Prompt schema with ID ${id} not found`);
      }

      return updatedPromptSchema;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update ${timeField}: ${error.message}`);
      throw new Error(`Failed to update ${timeField}: ${error.message}`);
    }
  }

  async removePromptSchema(id: string): Promise<PromptDocument> {
    try {
      const deletedPromptSchema = await this.promptModel
        .findByIdAndDelete(id)
        .exec();

      if (!deletedPromptSchema) {
        throw new NotFoundException(`Prompt schema with ID ${id} not found`);
      }

      return deletedPromptSchema;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete prompt schema: ${error.message}`);
      throw new Error(`Failed to delete prompt schema: ${error.message}`);
    }
  }

  async createAiModel(createAIModelDTO: CreateAIModelDTO) {
    this.logger.log(`Creating AI model: ${createAIModelDTO.modelName}`);
    try {
      const aiModel = await this.aiModel.create(createAIModelDTO);
      this.logger.log(`Successfully created AI model: ${aiModel._id}`);
      return aiModel;
    } catch (error) {
      this.logger.error(`Failed to create AI model: ${error.message}`);
      throw new Error(`Failed to create AI model: ${error.message}`);
    }
  }

  async updateAiModel(updateAIModelDTO: UpdateAIModelDTO) {
    this.logger.log(`Updating AI model: ${updateAIModelDTO.modelName}`);
    try {
      const aiModel = await this.aiModel
        .findByIdAndUpdate(updateAIModelDTO._id, updateAIModelDTO, {
          new: true,
        })
        .exec();

      if (!aiModel) {
        throw new NotFoundException(
          `AI model with ID ${updateAIModelDTO._id} not found`,
        );
      }

      this.logger.log(`Successfully updated AI model: ${aiModel._id}`);
      return aiModel;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update AI model: ${error.message}`);
      throw new Error(`Failed to update AI model: ${error.message}`);
    }
  }

  /**
   * Tính thời điểm nửa đêm ngày mai
   * @returns Thời điểm nửa đêm ngày mai
   */
  private getTomorrowMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Tính thời điểm phút tiếp theo
   * @returns Thời điểm phút tiếp theo
   */
  private getNextMinute(): Date {
    const nextMinute = new Date();
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    nextMinute.setSeconds(0, 0);
    return nextMinute;
  }

  /**
   * Ước lượng số token của một chuỗi (ước lượng thô)
   * @param text Chuỗi cần ước lượng
   * @returns Số token ước lượng
   */
  private estimateTokenCount(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4); // 1 token ≈ 4 ký tự
  }
}
