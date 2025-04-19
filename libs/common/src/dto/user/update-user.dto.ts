// libs/common/src/dto/user/update-user.dto.ts
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsDateString,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Command } from '../../kafka/interfaces/message-patterns.interface';
import { UserRole, UserStatus } from '@app/common/enums';

class SocialAccountDto {
  @IsString()
  provider: string;

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

class AddressDto {
  @IsString()
  fullAddress: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsBoolean()
  isDefault: boolean;
}

class PhoneNumberDto {
  @IsString()
  number: string;

  @IsString()
  countryCode: string;

  @IsBoolean()
  isVerified: boolean;

  @IsBoolean()
  isPrimary: boolean;
}

class PreferencesDto {
  @IsBoolean()
  emailNotifications: boolean;

  @IsBoolean()
  smsNotifications: boolean;

  @IsBoolean()
  marketingEmails: boolean;
}

class StoreInfoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  banners?: string[];

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsDateString()
  joinedDate?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberDto)
  phoneNumbers?: PhoneNumberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialAccountDto)
  socialAccounts?: SocialAccountDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StoreInfoDto)
  storeInfo?: StoreInfoDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Example of a Command using this DTO
export class UpdateUserCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly data: UpdateUserDto,
    metadata?: any,
  ) {
    super(metadata);
  }
}
