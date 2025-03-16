// apps/api-gateway/src/auth/auth.controller.ts
import { Body, Controller, Post, Req, Get, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/common/dto/auth/login.dto';
import { RefreshTokenDto } from '@app/common/dto/auth/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '@app/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const { email, password } = loginDto;
    
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    
    return this.authService.login(email, password, userAgent, ipAddress);
  }

  @Post('register')
  async register(@Body() userData: CreateUserDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    
    return this.authService.register(userData, userAgent, ipAddress);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    
    return this.authService.refreshToken(refreshTokenDto.refreshToken, userAgent, ipAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user.sub;
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    const userId = req.user.sub;
    return this.authService.getProfile(userId);
  }

  @Post('validate')
  async validateToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }
}