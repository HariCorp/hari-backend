import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Admin } from 'kafkajs';

@Injectable()
export class KafkaAdminService implements OnModuleInit {
  private readonly logger = new Logger(KafkaAdminService.name);
  private admin: Admin;

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      // Access the internal KafkaJS client to get the admin
      const kafka = (this.kafkaClient as any).client;
      if (!kafka) {
        throw new Error('Could not access Kafka client');
      }
      
      this.admin = kafka.admin();
      await this.admin.connect();
      this.logger.log('Kafka admin connected');
    } catch (error) {
      this.logger.error(`Failed to initialize Kafka admin: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create topics if they don't exist
   * @param topics Array of topic names
   * @param numPartitions Number of partitions (default: 1)
   * @param replicationFactor Replication factor (default: 1)
   */
  async createTopics(
    topics: string[],
    numPartitions = 1,
    replicationFactor = 1,
  ): Promise<void> {
    try {
      const existingTopics = await this.listTopics();
      const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));
      
      if (topicsToCreate.length === 0) {
        this.logger.log('All topics already exist');
        return;
      }
      
      await this.admin.createTopics({
        topics: topicsToCreate.map(topic => ({
          topic,
          numPartitions,
          replicationFactor,
        })),
      });
      
      this.logger.log(`Created topics: ${topicsToCreate.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to create topics: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all topics
   * @returns Array of topic names
   */
  async listTopics(): Promise<string[]> {
    try {
      return await this.admin.listTopics();
    } catch (error) {
      this.logger.error(`Failed to list topics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete topics
   * @param topics Array of topic names
   */
  async deleteTopics(topics: string[]): Promise<void> {
    try {
      await this.admin.deleteTopics({
        topics,
      });
      this.logger.log(`Deleted topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to delete topics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if topics exist
   * @param topics Array of topic names
   * @returns Object with topic existence status
   */
  async topicsExist(topics: string[]): Promise<Record<string, boolean>> {
    try {
      const existingTopics = await this.listTopics();
      return topics.reduce((acc, topic) => {
        acc[topic] = existingTopics.includes(topic);
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`Failed to check topics existence: ${error.message}`);
      throw error;
    }
  }
}