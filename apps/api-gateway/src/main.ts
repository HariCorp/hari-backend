// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';
import { setupHttpApp, setupMicroserviceApp } from '@app/common/bootstrap';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { UserService } from './user/user.service';
import { UserRole } from '@app/common';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  
  // Create HTTP application
  const app = await NestFactory.create(ApiGatewayModule);

  // Add cookie parser middleware
  app.use(cookieParser());

  // Set API prefix
  app.setGlobalPrefix('api');
  
  // Add response transform interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Add validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Setup CORS for frontend
  app.enableCors({
    origin: 'http://localhost:4000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept,Origin,X-Requested-With',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  // Setup global filters and pipes for HTTP
  setupHttpApp(app);
  
  // Get ConfigService from app
  const configService = app.get(ConfigService);
  
  // Get port from env, default to 3000
  const port = configService.get<number>('PORT', 3000);
  
  // Setup Kafka microservice
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'api-gateway-group'),
      },
    },
  });
  
  // Setup global filters for microservice
  setupMicroserviceApp(app);
  
  // Start microservice and HTTP server
  await app.startAllMicroservices();
  await app.listen(port);
  
  logger.log(`API Gateway HTTP is running on port: ${port}`);
  logger.log(`API Gateway HTTP URL: ${await app.getUrl()}`);
  logger.log('API Gateway Kafka microservice is running');

  // Initialize admin account after server is up
  try {
    logger.log('Checking for admin account...');
    const userService = app.get(UserService);
    
    // Get admin credentials from environment
    const adminEmail = configService.get<string>('SUPER_ADMIN_EMAIL');
    const adminPassword = configService.get<string>('SUPER_ADMIN_PASSWORD');
    const adminUsername = configService.get<string>('SUPER_ADMIN_USERNAME');

    if (!adminEmail || !adminPassword || !adminUsername) {
      logger.warn('Admin credentials not fully configured in environment variables');
      return;
    }

    // Check if admin exists
    const response = await userService.findAllUsers({ email: adminEmail, limit: 1 });
    
    // Check if response contains users
    const existingAdmin = extractUserFromResponse(response, adminEmail);
    
    if (existingAdmin) {
      logger.log(`SUP_ADMIN found`);
    } else {
      logger.log('No admin found. Creating admin account...');
      
      // Create admin user
      await userService.createUser({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roles: [UserRole.SUPER_ADMIN]
      });

      logger.log(`Admin account created successfully: ${adminEmail}`);
    }
  } catch (error) {
    logger.error(`Failed to initialize admin account: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper to safely extract user from various response formats
function extractUserFromResponse(response: any, email: string): any {
  if (!response) return null;
  
  // Try various response formats that might come back from the service
  
  // Format 1: { data: { users: [...] } }
  if (response.data && Array.isArray(response.data.users)) {
    const user = response.data.users.find((u: any) => u.email === email);
    if (user) return user;
  }
  
  // Format 2: { users: [...] }
  if (Array.isArray(response.users)) {
    const user = response.users.find((u: any) => u.email === email);
    if (user) return user;
  }
  
  // Format 3: { data: { items: [...] } }
  if (response.data && Array.isArray(response.data.items)) {
    const user = response.data.items.find((u: any) => u.email === email);
    if (user) return user;
  }
  
  // Format 4: { items: [...] }
  if (Array.isArray(response.items)) {
    const user = response.items.find((u: any) => u.email === email);
    if (user) return user;
  }
  
  return null;
}

bootstrap();