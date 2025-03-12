import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DiscoveryModule } from '@nestjs/core';
import { KafkaModuleOptions, KafkaModuleAsyncOptions } from './interfaces/kafka-options.interface';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaSerializer } from './serialization/kafka-serializer';
import { KafkaDeserializer } from './serialization/kafka-deserializer';
import { KafkaExplorerService } from './kafka-explorer.service';
import { KafkaAdminService } from './admin/kafka-admin.service';
import { KafkaApplicationListener } from './kafka-application.listener';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DiscoveryModule, 
  ],
  providers: [
    KafkaProducerService,
    KafkaConsumerService,
    KafkaSerializer,
    KafkaDeserializer,
    KafkaExplorerService,
    KafkaAdminService,
    KafkaApplicationListener,
  ],
  exports: [
    KafkaProducerService,
    KafkaConsumerService,
    KafkaAdminService,
  ],
})
export class KafkaModule {
  static forRoot(options: KafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        DiscoveryModule,
      ],
      providers: [
        KafkaProducerService,
        KafkaConsumerService,
        KafkaSerializer,
        KafkaDeserializer,
        KafkaExplorerService,
        KafkaAdminService,
        KafkaApplicationListener,
      ],
      exports: [
        KafkaProducerService,
        KafkaConsumerService,
        KafkaAdminService,
      ],
    };
  }

  static forRootAsync(options: KafkaModuleAsyncOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        DiscoveryModule,
        ...(options.imports || []),
        ClientsModule.registerAsync([
          {
            name: 'KAFKA_CLIENT',
            imports: options.imports || [],
            useFactory: async (...args) => {
              const kafkaOptions = await options.useFactory(...args);
              return {
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId: kafkaOptions.clientId,
                    brokers: kafkaOptions.brokers,
                    ssl: kafkaOptions.ssl,
                    sasl: kafkaOptions.sasl,
                    connectionTimeout: 3000, // 3 seconds
                    retry: {
                      initialRetryTime: 100,
                      retries: 8,
                      maxRetryTime: 30000, // 30 seconds max retry time
                      factor: 2, // Exponential backoff factor
                      multiplier: 1.5 // Incremental backoff
                    }
                  },
                  consumer: {
                    groupId: kafkaOptions.groupId,
                    sessionTimeout: 30000, // 30 seconds
                    rebalanceTimeout: 60000, // 60 seconds
                    heartbeatInterval: 3000, // 3 seconds
                    allowAutoTopicCreation: true,
                    maxBytesPerPartition: 1048576, // 1MB
                    maxWaitTimeInMs: 5000 // 5 seconds
                  },
                  producer: {
                    allowAutoTopicCreation: true,
                    idempotent: true, // Ensures exactly-once delivery
                    maxInFlightRequests: 5,
                    transactionalId: `${kafkaOptions.clientId}-transactional`,
                    // Compression helps with larger messages and network efficiency
                    compression: 'gzip' // Options: none, gzip, snappy, lz4
                  },
                },
              };
            },
            inject: options.inject || [],
          },
        ]),
      ],
      providers: [
        {
          provide: 'KAFKA_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        KafkaProducerService,
        KafkaConsumerService,
        KafkaSerializer,
        KafkaDeserializer,
        KafkaExplorerService,
        KafkaAdminService,
        KafkaApplicationListener,
      ],
      exports: [
        KafkaProducerService,
        KafkaConsumerService,
        KafkaAdminService,
      ],
    };
  }
}