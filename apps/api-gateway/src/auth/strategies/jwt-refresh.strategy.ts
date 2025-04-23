// apps/api-gateway/src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // Bật để truyền request vào validate
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Có thể thêm logic kiểm tra refreshToken nếu cần
    // Ví dụ: kiểm tra trong database qua authService
    // await this.authService.validateRefreshToken(payload.sub, refreshToken);

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      isVerified: payload.isVerified,
      refreshToken,
    };
  }
}
