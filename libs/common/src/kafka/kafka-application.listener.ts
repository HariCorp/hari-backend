import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { KafkaExplorerService } from './kafka-explorer.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Injectable()
export class KafkaApplicationListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(KafkaApplicationListener.name);

  constructor(
    private readonly explorerService: KafkaExplorerService,
    private readonly consumerService: KafkaConsumerService
  ) {}

  async onApplicationBootstrap() {
    // Được gọi sau khi tất cả các module đã được khởi tạo
    this.logger.log('Application bootstrapped, exploring Kafka handlers...');
    
    // Đầu tiên, quét để tìm tất cả các handlers
    this.explorerService.explore();
    
    // Sau đó, kết nối consumer sau khi đã đăng ký các handlers
    await this.consumerService.connect();
    
    this.logger.log('Kafka handlers explored and connected successfully');
  }
}