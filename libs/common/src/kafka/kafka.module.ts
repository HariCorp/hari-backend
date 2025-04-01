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

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => KafkaModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        DiscoveryModule,
        ...(options.imports || []),
        ClientsModule.registerAsync([
          {
            name: 'KAFKA_CLIENT',
            imports: options.imports || [],
            useFactory: (...args: any[]) => {
              const config = options.useFactory(...args);
              return {
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId: config.clientId,
                    brokers: config.brokers,
                    ssl: config.ssl,
                  },
                  consumer: {
                    groupId: config.groupId,
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