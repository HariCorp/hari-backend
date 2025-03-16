// apps/auth-service/src/auth-service.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { KafkaMessageHandler } from '@app/common/kafka/decorators/kafka-message-handler.decorator';
import { CreateUserDto } from '@app/common';

@Controller()
export class AuthServiceController {
  private readonly logger = new Logger(AuthServiceController.name);

  constructor(private readonly authService: AuthServiceService) {}

  @MessagePattern('ms.auth.login')
  @KafkaMessageHandler({ topic: 'ms.auth.login' })
  async login(data: { username: string; password: string; userAgent?: string; ipAddress?: string }) {
    this.logger.log(`Login attempt for user: ${data.username}`);
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
  async logout(data: { userId: string }) {
    this.logger.log(`Logout request for user: ${data.userId}`);
    return this.authService.logout(data.userId);
  }

  @MessagePattern('ms.auth.revoke')
  @KafkaMessageHandler({ topic: 'ms.auth.revoke' })
  async revokeToken(data: { refreshToken: string }) {
    this.logger.log('Token revocation request');
    return this.authService.revokeToken(data.refreshToken);
  }
}