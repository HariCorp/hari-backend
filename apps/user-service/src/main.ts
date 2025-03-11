import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);
  
  // Lấy ConfigService từ ứng dụng
  const configService = app.get(ConfigService);
  
  // Lấy giá trị PORT từ env, với giá trị mặc định là 3002 nếu không tìm thấy
  const port = configService.get<number>('PORT', 3002);
  
  await app.listen(port);
  
  console.log(`User Service is running on port: ${port}`);
  console.log(`User Service URL: ${await app.getUrl()}`);
}

bootstrap();