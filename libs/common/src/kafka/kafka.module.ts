import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DiscoveryModule } from '@nestjs/core';
import { KafkaModuleOptions, KafkaModuleAsyncOptions } from './interfaces/kafka-options.interface';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaSerializer } from './serialization/kafka-serializer';
import { KafkaDeserializer } from './serialization/kafka-deserializer';
import { KafkaExplorerService } from './kafka-explorer.service';
import {KafkaAdminService} from './admin/kafka-admin.service'

@Global()
@Module({
  providers: [
    KafkaProducerService,
    KafkaConsumerService,
    // Các providers khác
  ],
  exports: [
    KafkaProducerService,
    KafkaConsumerService,
    // Các exports khác
  ],
})
export class KafkaModule {
  static forRoot(options: KafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        DiscoveryModule,
        ClientsModule.register([
          {
            name: 'KAFKA_CLIENT',
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: options.clientId,
                brokers: options.brokers,
                ssl: options.ssl,
                sasl: options.sasl,
              },
              consumer: {
                groupId: options.groupId,
              },
            },
          },
        ]),
      ],
      providers: [
        KafkaProducerService,
        KafkaConsumerService,
        KafkaSerializer,
        KafkaDeserializer,
        KafkaExplorerService,
        KafkaAdminService
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
                  },
                  consumer: {
                    groupId: kafkaOptions.groupId,
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
      ],
      exports: [
        KafkaProducerService,
        KafkaConsumerService,
        KafkaAdminService,
      ],
    };
  }
}