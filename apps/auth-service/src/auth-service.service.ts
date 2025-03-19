// apps/auth-service/src/auth-service.service.ts
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, KafkaProducerService } from '@app/common';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import * as bcrypt from 'bcryptjs';

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
  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    try {
      // Verify user credentials with User Service
      const verifyResult = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.verifyCredentials',
        {
          email,
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
          message: 'Invalid email or password',
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
            type: 'command',
          },
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
      // Xác minh refreshToken là JWT hợp lệ
      const payload = this.jwtService.verify(refreshTokenString, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      console.log('Payload:', payload);

      // Tìm tất cả token của user chưa bị thu hồi và còn hiệu lực
      const refreshTokens = await this.refreshTokenModel.find({
        userId: payload.sub,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });
      console.log('Refresh tokens in DB:', refreshTokens);

      // So sánh refreshTokenString với từng token trong database
      let validTokenDoc: RefreshTokenDocument | null = null;
      for (const tokenDoc of refreshTokens) {
        const isMatch = await bcrypt.compare(refreshTokenString, tokenDoc.token);
        console.log('Token match:', isMatch, 'for token:', tokenDoc.token);
        if (isMatch) {
          validTokenDoc = tokenDoc;
          break;
        }
      }

      if (!validTokenDoc) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get user details
      const userResponse = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.findById',
        { userId: validTokenDoc.userId },
      );

      if (userResponse.status === 'error' || !userResponse.data) {
        throw new UnauthorizedException('User not found');
      }

      const user = userResponse.data;

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Revoke old refresh token
      await this.refreshTokenModel.findByIdAndUpdate(validTokenDoc._id, {
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
  async logout(userId: string, refreshTokenString: string) {
    try {
      this.logger.log(`Logging out user ${userId}`);
      
      // Tìm tất cả refresh token chưa bị thu hồi của user
      const refreshTokens = await this.refreshTokenModel.find({
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });
      
      if (refreshTokens.length === 0) {
        this.logger.warn(`No active refresh tokens found for user ${userId}`);
        return {
          status: 'success',
          data: { 
            message: 'No active sessions to logout',
            tokensRevoked: 0
          },
        };
      }
      
      // Kiểm tra xem refreshTokenString có khớp với bất kỳ token nào không
      let foundMatch = false;
      let revokedCount = 0;
      
      for (const tokenDoc of refreshTokens) {
        try {
          // So sánh refreshTokenString với hash trong database
          const isMatch = await bcrypt.compare(refreshTokenString, tokenDoc.token);
          
          if (isMatch) {
            // Thu hồi token này
            await this.refreshTokenModel.findByIdAndUpdate(tokenDoc._id, {
              isRevoked: true,
              lastUsedAt: new Date(),
            });
            foundMatch = true;
            revokedCount++;
            this.logger.log(`Revoked refresh token for user ${userId}`);
          }
        } catch (bcryptError) {
          this.logger.error(`Error comparing refresh tokens: ${bcryptError.message}`);
          // Tiếp tục với token tiếp theo
        }
      }
      
      // Nếu không tìm thấy token phù hợp, thu hồi tất cả token của user
      if (!foundMatch) {
        this.logger.warn(`No matching refresh token found, revoking all tokens for user ${userId}`);
        
        const result = await this.refreshTokenModel.updateMany(
          { userId, isRevoked: false },
          { isRevoked: true, lastUsedAt: new Date() }
        );
        
        revokedCount = result.modifiedCount;
      }
      
      return {
        status: 'success',
        data: { 
          message: 'Logged out successfully',
          tokensRevoked: revokedCount
        },
      };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: { 
          code: 'LOGOUT_FAILED', 
          message: 'Failed to logout'
        },
      };
    }
  }

  /**
   * Generate JWT access and refresh tokens
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
  
    // Get values from config service
    const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '3600');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '2592000');
    
    // Convert to numbers explicitly
    const accessExpiresInSeconds = parseInt(accessTokenExpiresIn, 10);
    const refreshExpiresInSeconds = parseInt(refreshTokenExpiresIn, 10);
    
    console.log('Token expiration times - Access:', accessExpiresInSeconds, 'Refresh:', refreshExpiresInSeconds);
  
    // Use the parsed numeric values for token signing
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: accessExpiresInSeconds
    });
  
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: refreshExpiresInSeconds
    });
  
    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresInSeconds,
      tokenType: 'Bearer',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      }
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
    console.log('thoi gian het han:', refreshExpiresIn)
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + (refreshExpiresIn * 1000));
    console.log("hethan", expiresAt)

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
    return await bcrypt.hash(token, 10);
  }
}