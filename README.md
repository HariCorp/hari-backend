<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Hướng dẫn tạo Microservice trong Hệ thống NestJS với Kafka

## Mục lục

1. [Cấu trúc cơ bản](#1-cấu-trúc-cơ-bản-của-một-microservice)
2. [Các bước tạo microservice](#2-các-bước-tạo-microservice)
3. [Xử lý Kafka Message Pattern](#3-xử-lý-kafka-message-pattern)
4. [Quy ước đặt tên và chuẩn hóa](#4-quy-ước-đặt-tên-và-chuẩn-hóa)
5. [Xử lý lỗi và kiểm tra](#5-xử-lý-lỗi-và-kiểm-tra)
6. [Các lưu ý quan trọng](#6-các-lưu-ý-quan-trọng)
7. [Khởi động và kiểm tra](#7-khởi-động-và-kiểm-tra)
8. [Ví dụ thực tế](#8-ví-dụ-thực-tế)

## 1. Cấu trúc cơ bản của một microservice

Một microservice trong hệ thống gồm 2 phần chính:

- **Phần trong API Gateway**: Chịu trách nhiệm tiếp nhận HTTP request và chuyển đổi thành Kafka message
- **Microservice riêng biệt**: Chịu trách nhiệm xử lý logic nghiệp vụ, không có HTTP endpoint

## 2. Các bước tạo microservice

### 2.1. Tạo cấu trúc thư mục microservice

```
apps/
  ├── {tên-service}/
  │   ├── src/
  │   │   ├── dto/            # Data Transfer Objects
  │   │   ├── schemas/        # MongoDB schemas
  │   │   ├── {tên}.module.ts # Module chính
  │   │   ├── {tên}.service.ts # Service xử lý logic
  │   │   ├── main.ts         # Entry point
  │   ├── test/               # Unit tests
  │   ├── .env                # Biến môi trường
  │   ├── tsconfig.app.json   # Cấu hình TypeScript
```

### 2.2. Tạo file schema (Nếu service cần lưu trữ dữ liệu)

Đặt trong thư mục `apps/{tên-service}/src/schemas/{tên}.schema.ts`

- Định nghĩa schema Mongoose
- Định nghĩa Document type và Model type
- Export schema để sử dụng trong module

### 2.3. Tạo file DTO

Đặt trong thư mục `apps/{tên-service}/src/dto/{tên}.dto.ts`

- Định nghĩa các class cho input data
- Sử dụng class-validator để validation
- Tạo riêng DTO cho từng operation (create, update,...)

### 2.4. Tạo Service

Đặt trong `apps/{tên-service}/src/{tên}.service.ts`

- Import các dependencies cần thiết
- Inject Model Mongoose nếu cần
- Định nghĩa các method xử lý logic
- Sử dụng Logger để ghi log
- Xử lý lỗi cẩn thận và trả về format nhất quán

### 2.5. Tạo Module

Đặt trong `apps/{tên-service}/src/{tên}.module.ts`

- Import MongooseModule với schema nếu cần
- Import các module khác cần thiết
- Đăng ký providers (service)
- Export service nếu cần

### 2.6. Tạo file main.ts

Đặt trong `apps/{tên-service}/src/main.ts`

- Tạo NestFactory.create
- Kết nối microservice với Kafka
- Sử dụng ConfigService để đọc biến môi trường
- Thêm validation pipes và các interceptors
- Khởi động microservice mà không mở HTTP port

### 2.7. Tạo file tsconfig.app.json

Đặt trong `apps/{tên-service}/tsconfig.app.json`

- Extend từ tsconfig.json gốc
- Cấu hình outDir đến thư mục dist
- Định nghĩa include và exclude paths

### 2.8. Cài đặt trong API Gateway

#### 2.8.1. Tạo Controller

Đặt trong `apps/api-gateway/src/{tên}{tên}.controller.ts`

- Định nghĩa các HTTP endpoints
- Sử dụng Guards cho authentication và authorization
- Xử lý và validate request
- Gọi đến service tương ứng

#### 2.8.2. Tạo Service

Đặt trong `apps/api-gateway/src/{tên}/{tên}.service.ts`

- Inject KafkaProducerService
- Định nghĩa các methods tương ứng với operations
- Gửi message đến Kafka và đợi response
- Xử lý lỗi và timeout

#### 2.8.3. Tạo Module

Đặt trong `apps/api-gateway/src/{tên}/{tên}.module.ts`

- Import các modules cần thiết (RbacModule, MulterModule,...)
- Đăng ký controllers và providers

#### 2.8.4. Thêm Module vào API Gateway

Sửa file `apps/api-gateway/src/api-gateway.module.ts`:

- Import module mới
- Thêm vào mảng imports

### 2.9. Đăng ký microservice trong NestJS

#### 2.9.1. Sửa nest-cli.json

Thêm service mới vào phần projects:

```json
"{tên-service}": {
  "type": "application",
  "root": "apps/{tên-service}",
  "entryFile": "main",
  "sourceRoot": "apps/{tên-service}/src",
  "compilerOptions": {
    "tsConfigPath": "apps/{tên-service}/tsconfig.app.json"
  }
}
```

#### 2.9.2. Thêm script vào package.json

```json
"start:{tên}": "nest start {tên-service}",
"start:{tên}:dev": "nest start {tên-service} --watch",
"start:{tên}:debug": "nest start {tên-service} --debug --watch"
```

## 3. Xử lý Kafka Message Pattern

### 3.1. Trong Microservice

- Xử lý các Kafka message với `@EventPattern('pattern-name')` cho non-request/response
- Xử lý các Kafka message với `@MessagePattern('pattern-name')` cho request/response

### 3.2. Trong API Gateway

- Đăng ký subscription cho topics trong ApiGatewayService
- Sử dụng KafkaProducerService.sendAndReceive cho request/response pattern
- Định nghĩa các message patterns cụ thể và nhất quán (ví dụ: 'ms.{service}.{operation}')

## 4. Quy ước đặt tên và chuẩn hóa

### 4.1. Message Pattern

- Prefix: 'ms'
- Service name: tên service
- Operation: create, update, delete, findAll, findOne, ...
- Ví dụ: 'ms.file.upload', 'ms.file.delete', 'ms.file.findAll'

### 4.2. Message Structure

```typescript
{
  data: object, // Dữ liệu chính
  metadata: {
    id: string, // ID duy nhất
    correlationId: string, // ID để liên kết request/response
    timestamp: number, // Thời gian tạo message
    source: string, // Nguồn gửi (thường là 'api-gateway')
    type: string, // 'command', 'query', 'event'
  }
}
```

### 4.3. Response Structure

```typescript
{
  status: 'success' | 'error',
  data?: any, // Kết quả khi thành công
  error?: {
    message: string,
    code?: string,
    details?: any
  }
}
```

## 5. Xử lý lỗi và kiểm tra

### 5.1. Xử lý lỗi

- Sử dụng try/catch trong mọi handler
- Log lỗi với NestJS Logger
- Trả về cấu trúc lỗi đồng nhất
- Sử dụng timeout hợp lý cho Kafka requests

### 5.2. Viết Unit Tests

- Tạo file `.spec.ts` cho mỗi service và controller
- Mock dependencies và Kafka client
- Test từng method riêng biệt
- Kiểm tra edge cases và error handling

## 6. Các lưu ý quan trọng

1. **Không mở HTTP port trong microservice**: Chỉ sử dụng Kafka để giao tiếp.
2. **Thống nhất cách xử lý authentication**: JWT nên được validate trong API Gateway, user ID truyền qua Kafka.
3. **Sử dụng ConfigService**: Đọc cấu hình từ .env file thay vì hardcode.
4. **Khởi động đúng cách**: Sử dụng `app.startAllMicroservices()` thay vì `app.listen()`.
5. **Kiểm tra các dependencies**: Thêm vào package.json nếu cần.
6. **Upload file**: Sử dụng base64 để truyền qua Kafka.
7. **Timeout**: Cấu hình timeout dài hơn cho các operations lâu (ví dụ upload file).
8. **Kết nối đúng với API Gateway**: Import module mới vào ApiGatewayModule.

## 7. Khởi động và kiểm tra

1. Build service: `nest build {tên-service}`
2. Khởi động service: `npm run start:{tên}`
3. Khởi động API Gateway: `npm run start:dev`
4. Test API endpoints với Postman hoặc curl
5. Kiểm tra logs để phát hiện lỗi
