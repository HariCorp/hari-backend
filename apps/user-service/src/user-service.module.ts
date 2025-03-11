import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigModule } from '@nestjs/config';
import { KafkaTestController } from './kafka-test.controller';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      envFilePath: 'user-service/.env',
    }),
  ],
  controllers: [UserServiceController, KafkaTestController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
