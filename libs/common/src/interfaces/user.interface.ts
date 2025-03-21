// libs/common/src/interfaces/user.interface.ts
import { Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export interface IUser {
  _id: Types.ObjectId | any;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  status: UserStatus;
  roles: UserRole[];
  socialAccounts?: Array<{
    provider: string;
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
  }>;
}