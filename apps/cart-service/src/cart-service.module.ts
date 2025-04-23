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
import { OrderServiceService } from './order-service.service';
import { Order, OrderSchema } from 'apps/api-gateway/src/order/order.schema';

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
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [CartServiceController],
  providers: [CartServiceService, OrderServiceService],
})
export class CartServiceModule {}
