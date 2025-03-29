import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { RbacModule } from '@app/common';

@Module({
  imports: [RbacModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
