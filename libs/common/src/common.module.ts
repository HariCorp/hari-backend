// libs/common/src/common.module.ts - Updated
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
// Import validation and filters
import { KafkaValidationPipe } from './validation/kafka-validation.pipe';
import { ValidationPipe } from './validation/validation.pipe';
import { HttpExceptionFilter, AllExceptionsFilter, KafkaExceptionFilter } from './filters';
import { CaslModule } from './casl/casl.module';

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
    CaslModule,
  ],
  providers: [
    // Provide validation pipes
    ValidationPipe,
    KafkaValidationPipe,
    // Provide exception filters
    HttpExceptionFilter,
    AllExceptionsFilter,
    KafkaExceptionFilter,
  ],
  exports: [
    KafkaModule,
    // Export validation pipes
    ValidationPipe,
    KafkaValidationPipe,
    // Export exception filters
    HttpExceptionFilter,
    AllExceptionsFilter,
    KafkaExceptionFilter,

    CaslModule,
  ],
})
export class CommonModule {}