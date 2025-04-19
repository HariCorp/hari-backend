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
  Put,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateApiKeyDto } from 'apps/ai-service/dto/create-api-key.dto';
import { UpdateApiKeyDto } from 'apps/ai-service/dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RBAC, RolesGuard } from '@app/common';
import { CompletionDto } from '@app/common/dto/ai/completion.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateAIModelDTO,
  UpdateAIModelDTO,
} from '@app/common/dto/ai/AIModel.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'apiKey', 'own')
  create(@Body() createApiKeyDto: CreateApiKeyDto, @CurrentUser() user) {
    createApiKeyDto.userId = user.userId; // Gán userId từ token vào createApiKeyDto

    return this.aiService.create(createApiKeyDto);
  }

  @Post('completion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'ai', 'own')
  async getCompletion(
    @Body(new ValidationPipe()) completionDto: CompletionDto,
    @CurrentUser() user,
  ) {
    completionDto.userId = user.userId; // Gán userId từ token vào completionDto
    try {
      if (!completionDto.prompt || completionDto.prompt.trim() === '') {
        throw new BadRequestException('Prompt cannot be empty');
      }

      const result = await this.aiService.getCompletion(completionDto);

      return {
        _message: 'AI completion successful',
        _data: result,
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

  @Post('create-ai-model')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'aiModel', 'any')
  async createAIModel(
    @Body(new ValidationPipe()) createAIModelDto: CreateAIModelDTO,
    @CurrentUser() user,
  ) {
    try {
      const result = await this.aiService.createAIModel(createAIModelDto);
      return {
        _message: 'AI model created successfully',
        _data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to create AI model',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('update-ai-model')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('update', 'aiModel', 'any')
  async updateAIModel(
    @Body(new ValidationPipe()) updateAIModelDto: UpdateAIModelDTO,
  ) {
    const result = await this.aiService.updateAIModel(updateAIModelDto);
    return {
      _message: 'AI model updated successfully',
      _data: result,
    };
  }
}
