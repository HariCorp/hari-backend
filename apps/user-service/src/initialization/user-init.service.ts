// apps/user-service/src/initialization/user-init.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';
import { UserRole, UserStatus } from '@app/common/enums';

@Injectable()
export class UserInitService implements OnModuleInit {
  private readonly logger = new Logger(UserInitService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createSuperAdminIfNotExists();
  }

  private async createSuperAdminIfNotExists() {
    // Đọc thông tin superAdmin từ biến môi trường
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const superAdminPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const superAdminUsername = this.configService.get<string>('SUPER_ADMIN_USERNAME');

    if (!superAdminEmail || !superAdminPassword) {
      this.logger.warn('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in environment variables');
      return;
    }

    try {
      // Kiểm tra xem đã tồn tại superAdmin chưa
      const existingSuperAdmin = await this.userModel.findOne({
        roles: UserRole.SUPER_ADMIN,
      });

      if (existingSuperAdmin) {
        this.logger.log('SuperAdmin account already exists');
        return;
      }

      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

      // Tạo tài khoản superAdmin
      const superAdmin = await this.userModel.create({
        email: superAdminEmail,
        username: superAdminUsername || 'superadmin',
        password: hashedPassword,
        roles: [UserRole.SUPER_ADMIN],
        status: UserStatus.ACTIVE,
        isVerified: true,
        firstName: 'Super',
        lastName: 'Admin',
      });

      this.logger.log(`SuperAdmin account created: ${superAdmin.email}`);
    } catch (error) {
      this.logger.error(`Failed to create SuperAdmin account: ${error.message}`);
    }
  }
}