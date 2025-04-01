import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AiServiceService } from './ai-service.service';
import { CreateApiKeyCommand } from '../dto/create-api-key.dto';
import { Logger } from '@nestjs/common';
import { ApiKeyType } from '../schemas/api-key.schema'; // Import enum ApiKeyType

@Controller()
export class AiServiceController {
  private readonly logger = new Logger(AiServiceController.name);

  constructor(private readonly aiServiceService: AiServiceService) {}

  /**
   * Xử lý yêu cầu tạo API key qua microservice pattern
   * @param command Dữ liệu yêu cầu tạo API key
   * @returns Phản hồi với trạng thái và dữ liệu hoặc lỗi
   */
  @MessagePattern('ms.apiKey.create')
  async createApiKey(command: CreateApiKeyCommand) {
    this.logger.log(`Nhận yêu cầu tạo API key: ${JSON.stringify(command)}`);

    try {
      const apiKey = await this.aiServiceService.create(command.data);
      this.logger.log(`Đã tạo API key thành công: ${apiKey._id}`);
      return {
        status: 'success',
        data: apiKey,
      };
    } catch (error) {
      this.logger.error(`Không thể tạo API key: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'API_KEY_CREATION_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Lấy API key với số lượng gọi hàng ngày thấp nhất qua microservice pattern
   * @param data Dữ liệu yêu cầu (loại API key tùy chọn, phải thuộc ApiKeyType)
   * @returns Phản hồi với trạng thái và API key hoặc lỗi
   */
  @MessagePattern('ms.apiKey.getLowestDailyCalls')
  async getApiKeyWithLowestDailyCalls(data: { type?: ApiKeyType }) {
    const apiKeyType = data?.type || ApiKeyType.GEMINI; // Mặc định là GEMINI nếu không có type
    this.logger.log(
      `Yêu cầu lấy API key với số lượng gọi thấp nhất: ${apiKeyType}`,
    );

    try {
      const apiKey =
        await this.aiServiceService.getApiKeyWithLowestDailyCalls(apiKeyType);
      if (!apiKey) {
        this.logger.warn('Không tìm thấy API key hoạt động');
        return {
          status: 'error',
          error: {
            code: 'API_KEY_NOT_FOUND',
            message: 'Không tìm thấy API key hoạt động',
          },
        };
      }

      this.logger.log(`Đã tìm thấy API key: ${apiKey.name}`);
      return {
        status: 'success',
        data: apiKey,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy API key: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'API_KEY_FETCH_ERROR',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gửi yêu cầu hoàn thành văn bản tới Gemini API qua microservice pattern
   * @param data Dữ liệu yêu cầu (prompt và tùy chọn)
   * @returns Phản hồi với trạng thái và kết quả hoặc lỗi
   */
  @MessagePattern('ms.ai.getCompletion')
  async getCompletion(data: { prompt: string; options?: any }) {
    this.logger.log(`Yêu cầu hoàn thành Gemini: ${JSON.stringify(data)}`);

    try {
      const { prompt, options } = data;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        this.logger.warn('Prompt không hợp lệ');
        return {
          status: 'error',
          error: {
            code: 'INVALID_REQUEST',
            message: 'Prompt là bắt buộc và phải là chuỗi không rỗng',
          },
        };
      }

      const result = await this.aiServiceService.getCompletion(
        prompt.trim(),
        options,
      );
      this.logger.log(`Hoàn thành thành công: ${JSON.stringify(result)}`);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi hoàn thành Gemini: ${error.message}`,
        error.stack,
      );
      return {
        status: 'error',
        error: {
          code:
            error.name === 'NotFoundException'
              ? 'API_KEY_NOT_FOUND'
              : 'COMPLETION_ERROR',
          message: error.message,
          details:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      };
    }
  }
  @MessagePattern('ms.promptSchema.create')
  async createPromptSchema(command: any) {
    this.logger.log(
      `Received create prompt schema request: ${JSON.stringify(command.data.name)}`,
    );

    try {
      const promptSchema = await this.aiServiceService.createPromptSchema(
        command.data,
      );

      return {
        status: 'success',
        data: promptSchema,
      };
    } catch (error) {
      this.logger.error(`Failed to create prompt schema: ${error.message}`);

      return {
        status: 'error',
        error: {
          code: 'PROMPT_SCHEMA_CREATION_FAILED',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.promptSchema.findAll')
  async findAllPromptSchemas(query: any = {}) {
    this.logger.log(
      `Received find all prompt schemas request with filter: ${JSON.stringify(query.filter || {})}`,
    );

    try {
      const result = await this.aiServiceService.findAllPromptSchemas(
        query.filter,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to find prompt schemas: ${error.message}`);

      return {
        status: 'error',
        error: {
          code: 'PROMPT_SCHEMA_FETCH_FAILED',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.promptSchema.findById')
  async findPromptSchemaById(query: { id: string }) {
    this.logger.log(`Received find prompt schema request with ID: ${query.id}`);

    try {
      const promptSchema = await this.aiServiceService.findPromptSchemaById(
        query.id,
      );

      return {
        status: 'success',
        data: promptSchema,
      };
    } catch (error) {
      this.logger.error(`Failed to find prompt schema by ID: ${error.message}`);

      return {
        status: 'error',
        error: {
          code:
            error.name === 'NotFoundException'
              ? 'PROMPT_SCHEMA_NOT_FOUND'
              : 'PROMPT_SCHEMA_FETCH_FAILED',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.promptSchema.update')
  async updatePromptSchema(command: { id: string; data: any }) {
    this.logger.log(
      `Received update prompt schema request for ID: ${command.id}`,
    );

    try {
      const promptSchema = await this.aiServiceService.updatePromptSchema(
        command.id,
        command.data,
      );

      return {
        status: 'success',
        data: promptSchema,
      };
    } catch (error) {
      this.logger.error(`Failed to update prompt schema: ${error.message}`);

      return {
        status: 'error',
        error: {
          code:
            error.name === 'NotFoundException'
              ? 'PROMPT_SCHEMA_NOT_FOUND'
              : 'PROMPT_SCHEMA_UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }
}
