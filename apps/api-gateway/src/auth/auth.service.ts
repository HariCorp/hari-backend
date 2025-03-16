// apps/api-gateway/src/auth/auth.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';
import { CreateUserDto } from '@app/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  async login(username: string, password: string, userAgent?: string, ipAddress?: string) {
    this.logger.log(`Login attempt for user: ${username}`);
    
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.login',
        {
          username,
          password,
          userAgent,
          ipAddress,
        },
      );

      if (response.status === 'error') {
        throw new UnauthorizedException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  async register(userData: CreateUserDto, userAgent?: string, ipAddress?: string) {
    this.logger.log(`Registration attempt for user: ${userData.username}`);
    
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.register',
        {
          userData,
          userAgent,
          ipAddress,
          metadata: {
            id: `api-${Date.now()}`,
            correlationId: `api-${Date.now()}`,
            timestamp: Date.now(),
            source: 'api-gateway',
            type: 'command'
          }
        }
      );
  
      this.logger.log('Received registration response');
    
      if (response.status === 'error') {
        this.logger.error(`Registration failed: ${response.error.message}`);
        throw new Error(response.error.message || 'Registration failed');
      }
    
      return response.data;
    } catch (error) {
      this.logger.error('Error during registration:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string, userAgent?: string, ipAddress?: string) {
    this.logger.log('Token refresh request');
    
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.refresh',
        {
          refreshToken,
          userAgent,
          ipAddress,
        },
      );

      if (response.status === 'error') {
        throw new UnauthorizedException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateToken(token: string) {
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.validate',
        { token },
      );

      return response;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired',
        },
      };
    }
  }

  async logout(userId: string) {
    this.logger.log(`Logout request for user: ${userId}`);
    
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.logout',
        { userId },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      throw new Error('Failed to logout');
    }
  }

  async getProfile(userId: string) {
    this.logger.log(`Get profile for user: ${userId}`);
    
    try {
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.findById',
        { userId },
      );

      if (response.status === 'error') {
        throw new UnauthorizedException('User not found');
      }

      // Remove sensitive information
      const user = response.data;
      const { password, ...userProfile } = user;
      
      return userProfile;
    } catch (error) {
      this.logger.error(`Get profile failed: ${error.message}`, error.stack);
      throw new Error('Failed to get user profile');
    }
  }
}