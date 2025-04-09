import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CartItem,
  CartItemSchema,
} from 'apps/api-gateway/src/cart/schemas/cart-item.schema';
import { CartServiceController } from './cart-service.controller';
import { CartServiceService } from './cart-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/cart-service/.env'],
      isGlobal: false,
      ignoreEnvFile: false,
    }),
    CommonModule,
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: CartItem.name, schema: CartItemSchema },
    ]),
  ],
  controllers: [CartServiceController],
  providers: [CartServiceService],
})
export class CartServiceModule {}
