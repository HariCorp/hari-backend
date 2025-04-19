import { Module } from '@nestjs/common';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '@app/common';
import { ApiKey, ApiKeySchema } from '../schemas/api-key.schema';
import { Prompt, PromptSchema } from '../schemas/prompt.schema';
import { AIModel, AIModelSchema } from '../schemas/ai-model.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/ai-service/.env'],
      isGlobal: false,
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
              clientId: configService.get('SERVICE_NAME', 'ai-service'),
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
            consumer: {
              groupId: configService.get<string>(
                'KAFKA_GROUP_ID',
                'ai-service-group',
              ),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
    MongooseModule.forFeature([{ name: AIModel.name, schema: AIModelSchema }]),
    CommonModule,
  ],
  controllers: [AiServiceController],
  providers: [AiServiceService],
})
export class AiServiceModule {}
