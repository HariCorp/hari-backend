import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '@app/common';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentController } from './payment-service.controller';
import { PaymentService } from './payment-service.service';
import { MomoProvider } from 'apps/api-gateway/payment/providers/momo.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/payment-service/.env'],
      isGlobal: true,
    }),
    CommonModule,
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, MomoProvider],
})
export class PaymentModule {}
