// apps/auth-service/src/auth-service.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '@app/common';

import { AuthServiceService } from './auth-service.service';
import { AuthServiceController } from './auth-service.controller';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // Cấu hình môi trường
    ConfigModule.forRoot({
      envFilePath: ['apps/auth-service/.env'],
      isGlobal: true,
    }),
    
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
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get<number>('JWT_ACCESS_EXPIRATION')}s`,
        },
      }),
      inject: [ConfigService],
    }),
    
    // Common module
    CommonModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}