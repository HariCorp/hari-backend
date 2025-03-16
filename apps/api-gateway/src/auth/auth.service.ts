// apps/api-gateway/src/auth/auth.service.ts
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, KafkaProducerService } from '@app/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka, // Inject ClientKafka
  ) {}

  async onModuleInit() {
    // Subscribe vào các topic phản hồi
    this.kafkaClient.subscribeToResponseOf('ms.auth.register');
    this.kafkaClient.subscribeToResponseOf('ms.auth.login');
    this.kafkaClient.subscribeToResponseOf('ms.auth.refresh');
    this.kafkaClient.subscribeToResponseOf('ms.auth.validate');
    this.kafkaClient.subscribeToResponseOf('ms.auth.logout');
    this.kafkaClient.subscribeToResponseOf('ms.user.findById');
    await this.kafkaClient.connect(); // Kết nối Kafka sau khi subscribe
    this.logger.log('Kafka client subscribed to response topics and connected');
  }

  async login(username: string, password: string, userAgent?: string, ipAddress?: string) {
    this.logger.log(`Login attempt for user: ${username}`);
    
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
  
      this.logger.log('Received registration response:', JSON.stringify(response));
    
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
  }

  async validateToken(token: string) {
    const response = await this.kafkaProducer.sendAndReceive<any, any>(
      'ms.auth.validate',
      { token },
    );

    return response;
  }

  async logout(userId: string) {
    this.logger.log(`Logout request for user: ${userId}`);
    
    const response = await this.kafkaProducer.sendAndReceive<any, any>(
      'ms.auth.logout',
      { userId },
    );

    return response.data;
  }

  async getProfile(userId: string) {
    this.logger.log(`Get profile for user: ${userId}`);
    
    const response = await this.kafkaProducer.sendAndReceive<any, any>(
      'ms.user.findById',
      { userId },
    );

    if (response.status === 'error') {
      throw new UnauthorizedException('User not found');
    }

    // Remove sensitive information
    const { password, ...userProfile } = response.data;
    
    return userProfile;
  }
}