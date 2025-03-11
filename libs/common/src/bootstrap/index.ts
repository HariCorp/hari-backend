// libs/common/src/bootstrap/index.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter, AllExceptionsFilter, KafkaExceptionFilter } from '../filters';
import { Logger } from '@nestjs/common';

/**
 * Áp dụng các global filters và pipes cho HTTP application
 * @param app NestJS application instance
 */
export function setupHttpApp(app: INestApplication): INestApplication {
  const logger = new Logger('AppBootstrap');

  // Apply global HTTP filters
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
  );

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  logger.log('HTTP application configured with global filters and pipes');
  
  return app;
}

/**
 * Áp dụng các global filters cho microservice application
 * @param app NestJS application instance
 */
export function setupMicroserviceApp(app: INestApplication): INestApplication {
  const logger = new Logger('MicroserviceBootstrap');

  // Apply global filters for microservices
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new KafkaExceptionFilter(),
  );

  logger.log('Microservice application configured with global filters');
  
  return app;
}
