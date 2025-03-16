// apps/user-service/src/user-service.service.ts
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { KafkaProducerService } from '@app/common/kafka/kafka-producer.service';
import { UserCreatedEvent } from '@app/common/dto/user/user-created.event';
import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@app/common/enums';
import { CreateUserDto, UpdateUserDto } from '@app/common';
import { FilterUserDto } from '@app/common/dto/user/filter-user.dto';

@Injectable()
export class UserServiceService {
  private readonly logger = new Logger(UserServiceService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with username: ${createUserDto.username}`);
    
    // Kiểm tra username và email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({
      $or: [
        { username: createUserDto.username },
        { email: createUserDto.email }
      ]
    });
    
    if (existingUser) {
      throw new ConflictException(
        existingUser.username === createUserDto.username 
          ? 'Username already exists' 
          : 'Email already exists'
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // Tạo user mới với role mặc định là USER
    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      roles: [UserRole.USER],
      status: UserStatus.ACTIVE
    });

    // Phát event khi user được tạo thành công
    await this.kafkaProducer.send('ms.user.created', new UserCreatedEvent(
      newUser._id.toString(),
      newUser.username,
      newUser.email
    ));
    
    return newUser;
  }

  async findAll(filterDto: FilterUserDto = {}): Promise<{ users: User[], total: number }> {
    const { 
      limit = 10, 
      page = 1, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      ...filters 
    } = filterDto;
  
    // Xây dựng filter query
    const filterQuery: FilterQuery<UserDocument> = {};
    
    // Thêm các điều kiện lọc
    if (filters.username) {
      filterQuery.username = { $regex: filters.username, $options: 'i' }; // Tìm kiếm không phân biệt chữ hoa/thường
    }
    
    if (filters.email) {
      filterQuery.email = { $regex: filters.email, $options: 'i' };
    }
    
    if (filters.firstName) {
      filterQuery.firstName = { $regex: filters.firstName, $options: 'i' };
    }
    
    if (filters.lastName) {
      filterQuery.lastName = { $regex: filters.lastName, $options: 'i' };
    }
    
    if (filters.status) {
      filterQuery.status = filters.status;
    }
    
    if (filters.roles && filters.roles.length > 0) {
      filterQuery.roles = { $in: filters.roles };
    }
    
    if (filters.isVerified !== undefined) {
      filterQuery.isVerified = filters.isVerified;
    }
    
    // Tính toán skip cho phân trang
    const skip = (page - 1) * limit;
    
    // Tạo sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Thực hiện query với phân trang và sắp xếp
    const [users, total] = await Promise.all([
      this.userModel.find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filterQuery)
    ]);
    
    return { users, total };
  }

  async findById(id: string): Promise<User> {
    try {
      const objectId = new Types.ObjectId(id);
      const user = await this.userModel.findById(objectId).exec();
      
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding user by ID: ${error.message}`);
      throw new NotFoundException(`User with ID ${id} not found or invalid ID`);
    }
  }

  async findByUsername(username: string, includePassword = false): Promise<User> {
    const query = this.userModel.findOne({ username });
    
    // Nếu cần lấy cả password (chỉ cho mục đích xác thực)
    if (includePassword) {
      query.select('+password');
    }
    
    const user = await query.exec();
    
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);
    try {
      const objectId = new Types.ObjectId(id);
      
      // Nếu cập nhật username hoặc email, kiểm tra xem đã tồn tại chưa
      if (updateUserDto.username || updateUserDto.email) {
        const conditions = [] as any[];
        
        if (updateUserDto.username) {
          conditions.push({ username: updateUserDto.username });
        }
        
        if (updateUserDto.email) {
          conditions.push({ email: updateUserDto.email });
        }
        
        if (conditions.length > 0) {
          const existingUser = await this.userModel.findOne({
            $and: [
              { _id: { $ne: objectId } }, // Loại trừ user hiện tại
              { $or: conditions }
            ]
          } as FilterQuery<UserDocument>);
          
          if (existingUser) {
            if (updateUserDto.username && existingUser.username === updateUserDto.username) {
              throw new ConflictException('Username already exists');
            }
            if (updateUserDto.email && existingUser.email === updateUserDto.email) {
              throw new ConflictException('Email already exists');
            }
          }
        }
      }
      
      // Nếu có cập nhật password, hash nó
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
      
      const updatedUser = await this.userModel.findByIdAndUpdate(
        objectId,
        updateUserDto,
        { new: true }
      ).exec();
      
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating user: ${error.message}`);
      throw new NotFoundException(`User with ID ${id} not found or invalid ID`);
    }
  }

  async delete(id: string): Promise<User> {
    this.logger.log(`Deleting user with ID: ${id}`);
    try {
      const objectId = new Types.ObjectId(id);
      const deletedUser = await this.userModel.findByIdAndDelete(objectId).exec();
      
      if (!deletedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      return deletedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting user: ${error.message}`);
      throw new NotFoundException(`User with ID ${id} not found or invalid ID`);
    }
  }

  // Thay đổi phương thức authenticate
  async verifyUserCredentials(username: string, password: string): Promise<{ isValid: boolean; user?: User }> {
    try {
      // Tìm user với username và lấy cả password
      const user = await this.findByUsername(username, true);
      
      // Kiểm tra password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return { isValid: false };
      }
      
      // Nếu hợp lệ, trả về user (không bao gồm password)
      const { password: _, ...userWithoutPassword } = user;
      return { 
        isValid: true, 
        user: userWithoutPassword as User
      };
    } catch (error) {
      this.logger.error(`Credentials verification failed: ${error.message}`);
      return { isValid: false };
    }
  }

  // Thêm phương thức mới để trả về user kèm thông tin xác thực (chỉ dành cho auth-service)
  async findUserWithPassword(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).select('+password').exec();
    
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    
    return user;
  }
}