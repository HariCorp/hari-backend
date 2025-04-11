// apps/auth-service/src/auth-service.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { KafkaMessageHandler } from '@app/common/kafka/decorators/kafka-message-handler.decorator';
import { CreateUserDto, ChangePasswordDto } from '@app/common';

@Controller()
export class AuthServiceController {
  private readonly logger = new Logger(AuthServiceController.name);

  constructor(private readonly authService: AuthServiceService) {}

  @MessagePattern('ms.auth.login')
  // @KafkaMessageHandler({ topic: 'ms.auth.login' })
  async login(data: { username: string; password: string; userAgent?: string; ipAddress?: string }) {
    this.logger.log(`Login attempt 111 for user: ${data.username}`);
    return this.authService.login(
      data.username,
      data.password,
      data.userAgent,
      data.ipAddress,
    );
  }

  @MessagePattern('ms.auth.register')
  @KafkaMessageHandler({ topic: 'ms.auth.register' })
  async register(data: { userData: CreateUserDto; userAgent?: string; ipAddress?: string }) {
    this.logger.log(`Registration attempt for userr: ${data.userData.username}`);
    return this.authService.register(
      data.userData,
      data.userAgent,
      data.ipAddress,
    );
  }

  @MessagePattern('ms.auth.refresh')
  @KafkaMessageHandler({ topic: 'ms.auth.refresh' })
  async refreshToken(data: { refreshToken: string; userAgent?: string; ipAddress?: string }) {
    this.logger.log('Token refresh request');
    return this.authService.refreshToken(
      data.refreshToken,
      data.userAgent,
      data.ipAddress,
    );
  }

  @MessagePattern('ms.auth.validate')
  @KafkaMessageHandler({ topic: 'ms.auth.validate' })
  async validateToken(data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern('ms.auth.logout')
  @KafkaMessageHandler({ topic: 'ms.auth.logout' })
  async logout(data: { userId: string; refreshToken: string }) {
    this.logger.log(`Logout request for user: ${data.userId}`);
  
    const { userId, refreshToken } = data;
    if (!refreshToken) {
      this.logger.warn(`Missing refresh token for user ${userId}`);
      return {
        status: 'error',
        error: { code: 'MISSING_TOKEN', message: 'Refresh token not provided' },
      };
    }
  
    return this.authService.logout(userId, refreshToken);
  }

  @MessagePattern('ms.auth.revoke')
  @KafkaMessageHandler({ topic: 'ms.auth.revoke' })
  async revokeToken(data: { refreshToken: string }) {
    this.logger.log('Token revocation request');
    return this.authService.revokeToken(data.refreshToken);
  }

  @MessagePattern('ms.auth.changePassword')
  @KafkaMessageHandler({ topic: 'ms.auth.changePassword' })
  async changePassword(data: { userId: string; currentPassword: string; newPassword: string; metadata?: any }) {
    this.logger.log(`Password change request for user: ${data.userId}`);
    
    const { userId, currentPassword, newPassword } = data;
    
    if (!userId || !currentPassword || !newPassword) {
      this.logger.warn('Missing required parameters for password change');
      return {
        status: 'error',
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Missing required parameters for password change' 
        },
      };
    }
    
    return this.authService.changePassword(userId, currentPassword, newPassword);
  }
}