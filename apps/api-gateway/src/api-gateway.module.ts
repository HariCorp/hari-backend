import { Module } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApiGatewayController } from './api-gateway.controller';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      envFilePath: './apps/api-gateway/.env',
    }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'KAFKA_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: configService.get<string>('KAFKA_GROUP_ID', 'gateway-consumer-group'),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}