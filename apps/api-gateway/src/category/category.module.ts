// apps/api-gateway/src/category/category.module.ts
import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { RbacModule } from '@app/common';

@Module({
  imports: [RbacModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}