// apps/api-gateway/src/auth/guards/jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
    console.log('Authorization header:', req.headers.authorization);
    
    // Nếu có token, thử in ra một phần để kiểm tra
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      console.log('Token part:', token.substring(0, 20) + '...');
    }

    if (err || !user) {
      console.log('JWT Auth Error type:', info?.name);
      console.log('JWT Auth Error message:', info?.message);
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}