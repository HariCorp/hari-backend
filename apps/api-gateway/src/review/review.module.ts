import { Module } from '@nestjs/common';
import { RbacModule } from '@app/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [RbacModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}