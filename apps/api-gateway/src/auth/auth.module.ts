// apps/api-gateway/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = parseInt(configService.get<string>('JWT_ACCESS_EXPIRATION', '3600'), 10);
        
        console.log('API Gateway JWT settings - Secret:', !!secret, 'ExpiresIn:', expiresIn);
        
        if (!secret) {
          console.error('ERROR: JWT_SECRET is not defined in environment variables!');
        }
        
        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn // Use the number value
          },
        };
      },
      inject: [ConfigService],
    }),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}