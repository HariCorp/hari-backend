import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { CommonModule } from '@app/common';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // Chỉ định rõ đường dẫn đến file .env của User Service
    ConfigModule.forRoot({
      envFilePath: [`apps/user-service/.env`],
      isGlobal: false,
      ignoreEnvFile: false,
    }),    
    CommonModule,
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: process.env.MONGODB_URI,
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