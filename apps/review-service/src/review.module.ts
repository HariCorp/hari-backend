// apps/review-service/src/review.module.ts
import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './review.schema';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/review-service/.env'],
      isGlobal: false,
      ignoreEnvFile: false,
    }),
    CommonModule,
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}