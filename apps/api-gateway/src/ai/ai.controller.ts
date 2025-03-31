import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateApiKeyDto } from 'apps/ai-service/dto/create-api-key.dto';
import { UpdateApiKeyDto } from 'apps/ai-service/dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RBAC, RolesGuard } from '@app/common';
import { CompletionDto } from '@app/common/dto/ai/completion.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'apiKey', 'any')
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.aiService.create(createApiKeyDto);
  }

  @Post('completion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'ai', 'any')
  async getCompletion(
    @Body(new ValidationPipe()) completionDto: CompletionDto,
  ) {
    try {
      if (!completionDto.prompt || completionDto.prompt.trim() === '') {
        throw new BadRequestException('Prompt cannot be empty');
      }

      // Kết hợp systemPrompt với prompt nếu có
      const systemPromptDefault =
        'Bạn là một nhân viên tư vấn bán hàng cho một trang web bán đồ ăn trực tuyến HariFood. Nhiệm vụ của bạn sẽ là đón khác, niềm nở trả lời các câu hỏi của khác hàng liên quan tới cửa hàng. Bạn có thể từ chối trả lời nếu khách hàng hỏi các vấn đề không liên quan đến cửa hàng. Tôi sẽ đặt tên cho bạn là Hari-Bot, khi bạn trả lời phải luôn giữ thái độ thân thiện, lịch sự, niềm nở với khách hàng';
      const systemPrompt = completionDto.systemPrompt || systemPromptDefault;
      const fullPrompt = systemPrompt
        ? `${systemPrompt.trim()}\n\n${completionDto.prompt.trim()}`
        : completionDto.prompt.trim();

      const result = await this.aiService.getCompletion(fullPrompt, {
        maxTokens: completionDto.maxTokens,
        temperature: completionDto.temperature,
        model: completionDto.model,
      });

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to get AI completion',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  findAll() {
    return this.aiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiDto: UpdateApiKeyDto) {
    return this.aiService.update(+id, updateAiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiService.remove(+id);
  }
}
