import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';
import { CreateUserDto, UpdateUserDto, FilterUserDto } from '@app/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async createUser(createUserDto: CreateUserDto) {
    this.logger.log(`Creating user with username: ${createUserDto.username}`);
    
    const command = {
      data: createUserDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command'
      }
    };
    
    return await this.kafkaProducer.send('ms.user.create', command);
  }

  async findAllUsers(filterDto: FilterUserDto = {}) {
    this.logger.log('Finding all users with filters');
    
    const query = {
      filter: filterDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query'
      }
    };
    
    return await this.kafkaProducer.sendAndReceive('ms.user.findAll', query);
  }

  async findUserById(id: string) {
    this.logger.log(`Finding user by ID: ${id}`);
    
    const query = {
      userId: id,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query'
      }
    };
    
    return await this.kafkaProducer.sendAndReceive('ms.user.findById', query);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user with ID: ${id}`);
    
    const command = {
      userId: id,
      data: updateUserDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command'
      }
    };
    
    return await this.kafkaProducer.sendAndReceive('ms.user.update', command);
  }

  async deleteUser(id: string) {
    this.logger.log(`Deleting user with ID: ${id}`);
    
    const command = {
      userId: id,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command'
      }
    };
    
    return await this.kafkaProducer.sendAndReceive('ms.user.delete', command);
  }

  async authenticate(username: string, password: string) {
    this.logger.log(`Authenticating user: ${username}`);
    
    const command = {
      username,
      password,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command'
      }
    };
    
    return await this.kafkaProducer.sendAndReceive('ms.user.authenticate', command);
  }
}