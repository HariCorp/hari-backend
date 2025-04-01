// libs/common/src/common.module.ts - Updated to include RBAC module
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { RbacModule } from './rbac/rbac.module';
// Import validation and filters
import { KafkaValidationPipe } from './validation/kafka-validation.pipe';
import { ValidationPipe } from './validation/validation.pipe';
import { HttpExceptionFilter, AllExceptionsFilter, KafkaExceptionFilter } from './filters';
// Import JWT strategies and guards
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { RolesGuard } from './rbac/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_SERVICE } from './interfaces/auth.interface';
import { KafkaProducerService } from './kafka/kafka-producer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get('KAFKA_CLIENT_ID');
        const brokers = configService.get('KAFKA_BROKERS');
        const groupId = configService.get('KAFKA_GROUP_ID');
        const ssl = configService.get('KAFKA_SSL') === 'true';

        if (!clientId || !brokers || !groupId) {
          throw new Error('Missing required Kafka configuration');
        }

        const config: any = {
          clientId,
          brokers: brokers.split(','),
          groupId,
          ssl,
          connectionTimeout: 3000,
          retry: {
            initialRetryTime: 100,
            retries: 8,
            maxRetryTime: 30000,
            factor: 2,
            multiplier: 1.5
          }
        };

        if (ssl) {
          const username = configService.get('KAFKA_USERNAME');
          const password = configService.get('KAFKA_PASSWORD');

          if (!username || !password) {
            throw new Error('Missing required Kafka SASL configuration');
          }

          config.sasl = {
            mechanism: 'plain',
            username,
            password,
          };
        }

        return config;
      },
      inject: [ConfigService],
    }),
    // Include the RBAC module
    RbacModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Provide validation pipes
    ValidationPipe,
    KafkaValidationPipe,
    // Provide exception filters
    HttpExceptionFilter,
    AllExceptionsFilter,
    KafkaExceptionFilter,
    // Provide JWT strategies and guards
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshAuthGuard,
    RolesGuard,
    {
      provide: AUTH_SERVICE,
      useFactory: (kafkaProducer: KafkaProducerService) => ({
        validateRefreshToken: async (userId: string, refreshToken: string) => {
          try {
            const response = await kafkaProducer.sendAndReceive<any, { status: string }>('ms.auth.validate', {
              userId,
              refreshToken,
            });
            return response.status === 'success';
          } catch (error) {
            return false;
          }
        },
      }),
      inject: [KafkaProducerService],
    },
  ],
  exports: [
    KafkaModule,
    // Export RBAC module
    RbacModule,
    // Export validation pipes
    ValidationPipe,
    KafkaValidationPipe,
    // Export exception filters
    HttpExceptionFilter,
    AllExceptionsFilter,
    KafkaExceptionFilter,
    // Export JWT strategies and guards
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshAuthGuard,
    RolesGuard,
    AUTH_SERVICE,
  ],
})
export class CommonModule {}