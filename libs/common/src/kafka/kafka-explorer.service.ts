import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KAFKA_MESSAGE_HANDLER, KafkaMessageHandlerOptions } from './decorators/kafka-message-handler.decorator';

@Injectable()
export class KafkaExplorerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaExplorerService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly kafkaConsumerService: KafkaConsumerService,
  ) {}

  onModuleInit() {
    this.explore();
  }

  /**
   * Explore all providers to find Kafka message handlers
   */
  explore() {
    const providers = this.discoveryService.getProviders();
    
    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      
      if (!instance || typeof instance !== 'object') {
        return;
      }
      
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (methodName: string) => this.exploreMethod(instance, methodName),
      );
    });
  }

  /**
   * Explore a class method to check if it's a Kafka message handler
   * @param instance Class instance
   * @param methodName Method name
   */
  exploreMethod(instance: object, methodName: string) {
    const methodRef = instance[methodName];
    const metadata = Reflect.getMetadata(KAFKA_MESSAGE_HANDLER, methodRef);
    
    if (!metadata) {
      return;
    }
    
    const handlerOptions: KafkaMessageHandlerOptions = metadata;
    
    this.logger.log(
      `Registering Kafka message handler: ${instance.constructor.name}.${methodName} for topic: ${handlerOptions.topic}`,
    );
    
    // Register the handler with the consumer service
    this.kafkaConsumerService.subscribe(
      handlerOptions,
      async (data, context) => {
        return await methodRef.call(instance, data, context);
      },
    );
  }
}