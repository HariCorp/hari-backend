// apps/api-gateway/src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  Get,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
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

    const result = await this.authService.login(
      email,
      password,
      userAgent,
      ipAddress,
    );
    // Sử dụng phương thức mới để set cookie
    this.authService.setCookieWithRefreshToken(result.refreshToken, res);
    return {
      _data: result,
      _message: 'Dang nhap thanh cong!',
      _statusCode: HttpStatus.OK,
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

    const result = await this.authService.register(
      userData,
      userAgent,
      ipAddress,
    );

    if (result.status === 'success' && result.data) {
      // Sử dụng phương thức mới để set cookie
      this.authService.setCookieWithRefreshToken(result.data.refreshToken, res);

      // Không trả về refresh token trong response
      const { refreshToken, ...responseData } = result.data;
      return { status: 'success', data: responseData };
    }

    return {
      _data: result,
      _message: 'Dang ky thanh cong!',
      _statusCode: HttpStatus.CREATED,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return {
        _data: null,
        _message: 'Refresh token không tồn tại',
        _statusCode: HttpStatus.UNAUTHORIZED,
      };
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    try {
      const result = await this.authService.refreshToken(
        refreshToken,
        userAgent,
        ipAddress,
      );
      console.log(
        '🔍 ~ refresh ~ apps/api-gateway/src/auth/auth.controller.ts:81 ~ result:',
        result,
      );

      if (result.status === 'success' && result.data) {
        // Đặt cookie mới
        this.authService.setCookieWithRefreshToken(
          result.data.refreshToken,
          res,
        );

        // Không trả về refresh token trong response
        const { refreshToken: newRefreshToken, ...responseData } = result.data;

        return {
          _data: responseData,
          _message: 'Làm mới token thành công',
          _statusCode: HttpStatus.OK,
        };
      }

      return {
        _data: null,
        _message: result.error?.message || 'Không thể làm mới token',
        _statusCode: HttpStatus.UNAUTHORIZED,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);

      return {
        _data: null,
        _message: 'Không thể làm mới token',
        _statusCode: HttpStatus.UNAUTHORIZED,
      };
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
            message: 'Authorization header missing or invalid format',
          },
        };
      }

      const token = authHeader.split(' ')[1];

      // Validate token using the existing service method
      const result = await this.authService.validateToken(token);

      return {
        _data: result,
        _message:
          result.status === 'success' ? 'Token is valid' : 'Token is invalid',
        _statusCode:
          result.status === 'success' ? HttpStatus.OK : HttpStatus.UNAUTHORIZED,
      };
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Failed to validate token',
        },
      };
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user) {
    this.logger.log(`Getting profile for user ID: ${user.userId}`);

    try {
      // Fetch full user profile from user service
      const userProfile = await this.authService.getProfile(user.userId);

      return {
        _data: userProfile,
        _message: 'Profile retrieved successfully',
        _statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(`Failed to get profile: ${error.message}`);

      return {
        _data: null,
        _message: 'Failed to retrieve user profile',
        _statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
