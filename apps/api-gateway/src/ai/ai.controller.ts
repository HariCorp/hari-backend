import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateApiKeyDto } from 'apps/ai-service/dto/create-api-key.dto';
import { UpdateApiKeyDto } from 'apps/ai-service/dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RBAC, RolesGuard } from '@app/common';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'apiKey', 'any')
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.aiService.create(createApiKeyDto);
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
