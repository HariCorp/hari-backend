// apps/api-gateway/src/auth/auth.controller.ts
import { Body, Controller, Post, Req, Res, Get, UseGuards, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/common/dto/auth/login.dto';
import { CreateUserDto } from '@app/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';


@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
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
      // Sử dụng phương thức mới để set cookie
      this.authService.setCookieWithRefreshToken(result.refreshToken, res);
    return {
      _data: result,
      _message: "Dang nhap thanh cong!",
      _statusCode: HttpStatus.OK
    };
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

    return {
      _data: result,
      _message: "Dang ky thanh cong!",
      _statusCode: HttpStatus.CREATED
    };
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

    return {
      _data: result,
      _message: "Refresh thanh cong!",
      _statusCode: HttpStatus.OK
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get the user ID from the CurrentUser decorator
    const userId = user.userId;
    const refreshToken = req.cookies.refreshToken;
    
    this.logger.log(`Logging out user: ${userId}`);
    
    if (!userId) {
      return {
        _message: 'User not authenticated',
        _statusCode: HttpStatus.UNAUTHORIZED,
        _data: null,
      };
    }
    
    if (!refreshToken) {
      return {
        _message: 'Refresh token not provided',
        _statusCode: HttpStatus.BAD_REQUEST,
        _data: null,
      };
    }

    // Call the logout method from the auth service with both userId and refreshToken
    const result = await this.authService.logout(userId, refreshToken);

    // Clear the cookies regardless of the result to ensure client-side logout
    this.authService.clearRefreshTokenCookie(res);
    
    return {
      _message: 'Đăng xuất thành công',
      _data: result,
      _statusCode: HttpStatus.OK,
    };
  }

  @Get('validate')
  @Public() // Since this endpoint is for validating the token itself
  async validateToken(@Req() req: Request) {
    try {
      // Extract token from the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_TOKEN',
            message: 'Authorization header missing or invalid format'
          }
        };
      }
      
      const token = authHeader.split(' ')[1];
      
      // Validate token using the existing service method
      const result = await this.authService.validateToken(token);
      
      return {
        _data: result,
        _message: result.status === 'success' ? 'Token is valid' : 'Token is invalid',
        _statusCode: result.status === 'success' ? HttpStatus.OK : HttpStatus.UNAUTHORIZED
      };
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Failed to validate token',
        }
      };
    }
  }
}