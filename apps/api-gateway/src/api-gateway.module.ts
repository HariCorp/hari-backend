import { Module } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApiGatewayController } from './api-gateway.controller';
import { CommonModule } from '@app/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { AiModule } from './ai/ai.module';
import { UploadModule } from './upload/upload.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      envFilePath: './apps/api-gateway/.env',
      isGlobal: true,
      ignoreEnvFile: false,
    }),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('SERVICE_NAME', 'api-gateway-client'),
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
            consumer: {
              groupId: configService.get<string>(
                'KAFKA_GROUP_ID',
                'api-gateway-consumer-group',
              ),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    UserModule,
    AuthModule,
    ProductModule,
    CategoryModule,
    AiModule,
    UploadModule,
    CartModule,
    OrderModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
