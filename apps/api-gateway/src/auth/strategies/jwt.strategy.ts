// apps/api-gateway/src/auth/strategies/jwt.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    this.logger.log('JwtStrategy initialized with secret from environment');
  }

  async validate(payload: any) {
    this.logger.log(`Validating JWT payload: ${JSON.stringify(payload)}`);
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    };
  }
}