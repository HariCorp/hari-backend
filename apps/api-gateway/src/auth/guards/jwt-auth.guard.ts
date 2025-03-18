// apps/api-gateway/src/auth/guards/jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Thêm xử lý lỗi để dễ debug
  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('JWT Auth Error:', info);
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}