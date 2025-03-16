// apps/user-service/src/user-service.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { KafkaMessageHandler } from '@app/common/kafka/decorators/kafka-message-handler.decorator';
import { CreateUserCommand, UpdateUserCommand, GetUserByIdQuery, FilterUserDto } from '@app/common';

@Controller()
export class UserServiceController {
  private readonly logger = new Logger(UserServiceController.name);

  constructor(private readonly userService: UserServiceService) {}

  @MessagePattern('ms.user.create')
  @KafkaMessageHandler({ topic: 'ms.user.create' })
  async createUser(command: CreateUserCommand) {
    this.logger.log(`Received create user command for username: ${command.data.username}`);
    try {
      const user = await this.userService.create(command.data);
      this.logger.log(`User created successfully: ${user._id}`);
      return {
        status: 'success',
        data: user
      };
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'CREATE_USER_ERROR',
          message: error.message
        }
      };
    }
  }

  @MessagePattern('ms.user.findAll')
  @KafkaMessageHandler({ topic: 'ms.user.findAll' })
  async findAllUsers(data: { filter?: FilterUserDto } = {}) {
    this.logger.log('Received find all users request with filters');
    try {
      const result = await this.userService.findAll(data.filter);
      return {
        status: 'success',
        data: {
          users: result.users,
          total: result.total,
          page: data.filter?.page || 1,
          limit: data.filter?.limit || 10
        }
      };
    } catch (error) {
      this.logger.error(`Failed to find users: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_USERS_ERROR',
          message: error.message
        }
      };
    }
  }

  @MessagePattern('ms.user.findById')
  @KafkaMessageHandler({ topic: 'ms.user.findById' })
  async findUserById(query: GetUserByIdQuery) {
    this.logger.log(`Received find user by ID query: ${query.userId}`);
    try {
      const user = await this.userService.findById(query.userId);
      return {
        status: 'success',
        data: user
      };
    } catch (error) {
      this.logger.error(`Failed to find user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_USER_ERROR',
          message: error.message
        }
      };
    }
  }

  @MessagePattern('ms.user.findByUsername')
  @KafkaMessageHandler({ topic: 'ms.user.findByUsername' })
  async findUserByUsername(data: { username: string }) {
    this.logger.log(`Received find user by username request: ${data.username}`);
    try {
      const user = await this.userService.findByUsername(data.username);
      return {
        status: 'success',
        data: user
      };
    } catch (error) {
      this.logger.error(`Failed to find user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_USER_ERROR',
          message: error.message
        }
      };
    }
  }

  @MessagePattern('ms.user.update')
  @KafkaMessageHandler({ topic: 'ms.user.update' })
  async updateUser(command: UpdateUserCommand) {
    this.logger.log(`Received update user command for ID: ${command.userId}`);
    try {
      const user = await this.userService.update(command.userId, command.data);
      return {
        status: 'success',
        data: user
      };
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'UPDATE_USER_ERROR',
          message: error.message
        }
      };
    }
  }

  @MessagePattern('ms.user.delete')
  @KafkaMessageHandler({ topic: 'ms.user.delete' })
  async deleteUser(data: { userId: string }) {
    this.logger.log(`Received delete user request for ID: ${data.userId}`);
    try {
      const user = await this.userService.delete(data.userId);
      return {
        status: 'success',
        data: {
          message: 'User deleted successfully',
          user
        }
      };
    } catch (error) {
      this.logger.error(`Failed to delete user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'DELETE_USER_ERROR',
          message: error.message
        }
      };
    }
  }

  @MessagePattern('ms.user.verifyCredentials')
  @KafkaMessageHandler({ topic: 'ms.user.verifyCredentials' })
  async verifyUserCredentials(data: { email: string; password: string }) {
    this.logger.log(`Received credential verification request for email: ${data.email}`);
    try {
      const result = await this.userService.verifyUserCredentials(data.email, data.password);
      
      if (!result.isValid) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials'
          }
        };
      }
      
      return {
        status: 'success',
        data: {
          isValid: true,
          user: result.user
        }
      };
    } catch (error) {
      this.logger.error(`Verification failed: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'Invalid credentials'
        }
      };
    }
  }

  @MessagePattern('ms.user.findUserWithAuth')
  @KafkaMessageHandler({ topic: 'ms.user.findUserWithAuth' })
  async findUserWithAuth(data: { username: string; requestSource: string }) {
    // Xác minh yêu cầu đến từ auth-service
    if (data.requestSource !== 'auth-service') {
      this.logger.warn(`Unauthorized attempt to access sensitive user data from: ${data.requestSource}`);
      return {
        status: 'error',
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: 'Only auth-service can access this endpoint'
        }
      };
    }
    
    this.logger.log(`Retrieving user with auth data for: ${data.username}`);
    try {
      const user = await this.userService.findUserWithPassword(data.username);
      return {
        status: 'success',
        data: user
      };
    } catch (error) {
      this.logger.error(`Failed to find user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_USER_ERROR',
          message: error.message
        }
      };
    }
  }
}