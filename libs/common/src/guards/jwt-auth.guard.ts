// apps/api-gateway/src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../constants/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If it's public, allow access without JWT verification
    if (isPublic) {
      return true;
    }

    // Otherwise, use the standard JWT authentication
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (context) {
      const req = context.switchToHttp().getRequest();
      if (req && req.headers) {
        console.log('Authorization header:', req.headers.authorization);

        // If there's a token, print part of it for checking
        if (req.headers.authorization) {
          const token = req.headers.authorization.split(' ')[1];
          console.log('Token part:', token.substring(0, 20) + '...');
        }
      }
    }

    if (err || !user) {
      console.log('JWT Auth Error type:', info?.name);
      console.log('JWT Auth Error message:', info?.message);
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
