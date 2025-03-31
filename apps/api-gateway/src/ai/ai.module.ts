import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RbacModule } from '@app/common';

@Module({
  imports: [RbacModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
