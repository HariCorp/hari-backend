import { MessageMetadata } from './kafka-message.interface';
import { MessageType } from '../constants/message-types.constant';

/**
 * Lớp cơ sở cho tất cả các message
 */
export abstract class BaseMessage {
  public readonly metadata: MessageMetadata;

  constructor(metadata?: Partial<MessageMetadata>) {
    const now = Date.now();
    const messageId = this.generateId();

    this.metadata = {
      id: metadata?.id || messageId,
      correlationId: metadata?.correlationId || messageId,
      timestamp: metadata?.timestamp || now,
      source: metadata?.source || process.env.SERVICE_NAME || 'unknown',
      type: this.getMessageType(),
    };
  }

  protected abstract getMessageType(): string;

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Lớp cơ sở cho các command
 */
export abstract class Command extends BaseMessage {
  protected getMessageType(): string {
    return MessageType.COMMAND;
  }
}

/**
 * Lớp cơ sở cho các event
 */
export abstract class Event extends BaseMessage {
  protected getMessageType(): string {
    return MessageType.EVENT;
  }
}

/**
 * Lớp cơ sở cho các query
 */
export abstract class Query extends BaseMessage {
  protected getMessageType(): string {
    return MessageType.QUERY;
  }
}