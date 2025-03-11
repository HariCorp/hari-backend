// libs/common/src/validation/interceptors/kafka-validation.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaValidationPipe } from '../kafka-validation.pipe';

@Injectable()
export class KafkaValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KafkaValidationInterceptor.name);
  private readonly validationPipe: KafkaValidationPipe;
  
  constructor(private readonly dtoClass: any) {
    this.validationPipe = new KafkaValidationPipe();
  }
  
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Only apply to Kafka RPC contexts
    if (context.getType() === 'rpc') {
      const rpcContext = context.switchToRpc();
      const kafkaContext = rpcContext.getContext<KafkaContext>();
      
      if (kafkaContext && typeof kafkaContext.getTopic === 'function') {
        const message = rpcContext.getData();
        
        try {
          // Validate the message payload
          const validatedData = await this.validationPipe.validateMessage(this.dtoClass, message);
          
          // Cast to any to bypass TypeScript checking
          const rpcContextAny = rpcContext as any;
          
          // Override getData method
          const originalGetData = rpcContextAny.getData;
          rpcContextAny.getData = () => validatedData;
          
          this.logger.debug(`Kafka message validated for topic: ${kafkaContext.getTopic()}`);
        } catch (error) {
          return throwError(() => error);
        }
      }
    }
    
    return next.handle();
  }
}