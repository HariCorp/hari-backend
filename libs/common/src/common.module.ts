// libs/common/src/common.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        clientId: configService.get('KAFKA_CLIENT_ID', 'default-client'),
        brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
        groupId: configService.get('KAFKA_GROUP_ID', 'default-group'),
        ssl: configService.get('KAFKA_SSL') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [KafkaModule], // Đảm bảo KafkaModule được export
})
export class CommonModule {}