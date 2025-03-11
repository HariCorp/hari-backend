import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);
  await app.listen(process.env.PORT || 3002);
  console.log(`User Service is running on: ${await app.getUrl()}`);
  console.log(process.env.port)
}
bootstrap();
