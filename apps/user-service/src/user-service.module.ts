import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      envFilePath: 'apps/user-service/.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}