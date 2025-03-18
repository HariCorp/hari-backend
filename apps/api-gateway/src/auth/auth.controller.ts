// apps/api-gateway/src/auth/auth.controller.ts
import { Body, Controller, Post, Req, Res, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/common/dto/auth/login.dto';
import { CreateUserDto } from '@app/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = loginDto;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await this.authService.login(email, password, userAgent, ipAddress);

    if (result.status === 'success' && result.data) {
      // Sử dụng phương thức mới để set cookie
      this.authService.setCookieWithRefreshToken(result.data.refreshToken, res);

      // Không trả về refresh token trong response
      const { refreshToken, ...responseData } = result.data;
      return { status: 'success', data: responseData };
    }

    return result;
  }

  @Post('register')
  async register(
    @Body() userData: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await this.authService.register(userData, userAgent, ipAddress);

    if (result.status === 'success' && result.data) {
      // Sử dụng phương thức mới để set cookie
      this.authService.setCookieWithRefreshToken(result.data.refreshToken, res);

      // Không trả về refresh token trong response
      const { refreshToken, ...responseData } = result.data;
      return { status: 'success', data: responseData };
    }

    return result;
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.userId;
    const refreshToken = req.cookies.refreshToken;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await this.authService.refreshToken(refreshToken, userAgent, ipAddress);

    if (result.status === 'success' && result.data) {
      // Sử dụng phương thức mới để set cookie với token mới
      this.authService.setCookieWithRefreshToken(result.data.refreshToken, res);

      // Không trả về refresh token trong response
      const { refreshToken, ...responseData } = result.data;
      return { status: 'success', data: responseData };
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.userId;

    // Xóa refresh token cookie
    this.authService.clearRefreshTokenCookie(res);

    // Thu hồi refresh token từ database
    const result = await this.authService.logout(userId);

    return {
      status: 'success',
      message: 'Đăng xuất thành công',
      data: result,
    };
  }
}