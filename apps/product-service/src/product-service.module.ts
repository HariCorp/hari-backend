import { Module } from '@nestjs/common';
import { ProductServiceController } from './product-service.controller';
import { ProductServiceService } from './product-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'apps/api-gateway/src/product/schemas/product.schema';
import { CommonModule } from '@app/common';
import { Category, CategorySchema } from 'apps/api-gateway/src/product/schemas/category.schema';
import { CategoryService } from './category.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/product-service/.env'],
      isGlobal: false,
      ignoreEnvFile: false,
    }),
    CommonModule,
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI')
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {name: Product.name, schema: ProductSchema},
      {name: Category.name, schema: CategorySchema}
    ]),
  ],
  
  controllers: [ProductServiceController],
  providers: [ProductServiceService, CategoryService],
})
export class ProductServiceModule {}
