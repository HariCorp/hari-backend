// apps/auth-service/src/auth-service.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, KafkaProducerService } from '@app/common';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Authenticate a user and generate tokens
   */
  async login(username: string, password: string, userAgent?: string, ipAddress?: string) {
    try {
      // Verify user credentials with User Service
      const verifyResult = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.verifyCredentials',
        {
          username,
          password,
        },
      );

      if (verifyResult.status === 'error' || !verifyResult.data?.isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = verifyResult.data.user;

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(
        tokens.refreshToken,
        user._id.toString(),
        userAgent,
        ipAddress,
      );

      return {
        status: 'success',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer',
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid username or password',
        },
      };
    }
  }

  /**
 * Register a new user and generate tokens
 */
  async register(userData: CreateUserDto, userAgent?: string, ipAddress?: string) {
    try {
      // Create user in UserService
      const createUserResponse = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.create',
        {
          data: userData,
          metadata: {
            id: `auth-${Date.now()}`,
            correlationId: `auth-${Date.now()}`,
            timestamp: Date.now(),
            source: 'auth-service',
            type: 'command'
          }
        },
      );

      if (createUserResponse.status === 'error') {
        return {
          status: 'error',
          error: {
            code: 'REGISTRATION_FAILED',
            message: createUserResponse.error.message || 'Failed to create user account',
          },
        };
      }

      const newUser = createUserResponse.data;

      // Generate tokens for the newly created user
      const tokens = await this.generateTokens(newUser);

      // Store refresh token
      await this.storeRefreshToken(
        tokens.refreshToken,
        newUser._id.toString(),
        userAgent,
        ipAddress,
      );

      return {
        status: 'success',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer',
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            roles: newUser.roles,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
        },
      };
    }
  }

  /**
   * Generate a new access token using a refresh token
   */
  async refreshToken(refreshTokenString: string, userAgent?: string, ipAddress?: string) {
    try {
      // Find the refresh token
      const refreshTokenDoc = await this.refreshTokenModel.findOne({
        token: await this.hashToken(refreshTokenString),
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });

      if (!refreshTokenDoc) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get user details
      const userResponse = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.findById',
        { userId: refreshTokenDoc.userId },
      );

      if (userResponse.status === 'error' || !userResponse.data) {
        throw new UnauthorizedException('User not found');
      }

      const user = userResponse.data;

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Revoke old refresh token
      await this.refreshTokenModel.findByIdAndUpdate(refreshTokenDoc._id, {
        isRevoked: true,
        lastUsedAt: new Date(),
      });

      // Store new refresh token
      await this.storeRefreshToken(
        tokens.refreshToken,
        user._id.toString(),
        userAgent,
        ipAddress,
      );

      return {
        status: 'success',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer',
        },
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'REFRESH_TOKEN_FAILED',
          message: 'Invalid or expired refresh token',
        },
      };
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(refreshTokenString: string) {
    try {
      const hashedToken = await this.hashToken(refreshTokenString);
      const result = await this.refreshTokenModel.updateOne(
        { token: hashedToken },
        { isRevoked: true },
      );

      if (result.modifiedCount === 0) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token not found or already revoked',
          },
        };
      }

      return {
        status: 'success',
        data: {
          message: 'Token revoked successfully',
        },
      };
    } catch (error) {
      this.logger.error(`Token revocation failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'REVOCATION_FAILED',
          message: 'Failed to revoke token',
        },
      };
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      // Get user details to ensure user still exists and is active
      const userResponse = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.findById',
        { userId: payload.sub },
      );

      if (userResponse.status === 'error' || !userResponse.data) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token is invalid or user doesn\'t exist',
          },
        };
      }

      const user = userResponse.data;
      
      // Check if user is active
      if (user.status !== 'active') {
        return {
          status: 'error',
          error: {
            code: 'USER_INACTIVE',
            message: 'User account is inactive',
          },
        };
      }

      return {
        status: 'success',
        data: {
          valid: true,
          payload,
        },
      };
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

  /**
   * Logout user by revoking all refresh tokens
   */
  async logout(userId: string) {
    try {
      const result = await this.refreshTokenModel.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true },
      );

      return {
        status: 'success',
        data: {
          message: 'Logged out successfully',
          tokensRevoked: result.modifiedCount,
        },
      };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
        },
      };
    }
  }

  /**
   * Generate JWT and refresh tokens
   */
  private async generateTokens(user: { 
    _id: string | any; 
    username: string; 
    email: string; 
    roles: string[]; 
  }) {
    const jwtPayload = {
      sub: typeof user._id === 'object' ? user._id.toString() : user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };

    const accessTokenExpiresIn = this.configService.get<number>('JWT_ACCESS_EXPIRATION', 3600); // Default 1 hour
    const refreshTokenExpiresIn = this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800); // Default 7 days

    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: accessTokenExpiresIn,
    });

    // Generate a secure random refresh token
    const refreshToken = uuidv4();

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
      refreshExpiresIn: refreshTokenExpiresIn,
    };
  }

  /**
   * Store refresh token in the database
   */
  private async storeRefreshToken(
    token: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const refreshExpiresIn = this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800); // Default 7 days
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshExpiresIn);

    // Hash the token before storing
    const hashedToken = await this.hashToken(token);

    await this.refreshTokenModel.create({
      token: hashedToken,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  /**
   * Hash a token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    // Using a simple hash is sufficient for tokens since they're already random
    return await bcrypt.hash(token, 10);
  }
}