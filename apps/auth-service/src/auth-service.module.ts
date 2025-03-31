// apps/auth-service/src/auth-service.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@app/common';

import { AuthServiceService } from './auth-service.service';
import { AuthServiceController } from './auth-service.controller';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // Cấu hình môi trường
    ConfigModule.forRoot({
      envFilePath: ['apps/auth-service/.env'],
      isGlobal: false,
      ignoreEnvFile: false,
    }),

    // Đăng ký Kafka client
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('SERVICE_NAME', 'auth-service'),
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
            consumer: {
              groupId: configService.get<string>(
                'KAFKA_GROUP_ID',
                'auth-service-group',
              ),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // Kết nối MongoDB
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Đăng ký schema
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),

    // Cấu hình JWT
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<number>(
          'JWT_ACCESS_EXPIRATION',
          3600,
        );

        console.log(
          'Auth Service JWT settings - Secret:',
          !!secret,
          'ExpiresIn:',
          expiresIn,
        );

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),

    // Common module
    CommonModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
