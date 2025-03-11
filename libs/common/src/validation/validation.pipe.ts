// libs/common/src/validation/validation.pipe.ts
import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
    Logger,
  } from '@nestjs/common';
  import { validate } from 'class-validator';
  import { plainToInstance } from 'class-transformer';
  
  @Injectable()
  export class ValidationPipe implements PipeTransform {
    private readonly logger = new Logger(ValidationPipe.name);
  
    async transform(value: any, { metatype }: ArgumentMetadata) {
      // If no metatype or it's a JavaScript native type, skip validation
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }
  
      // Convert plain objects to class instances
      const object = plainToInstance(metatype, value);
  
      // Validate the instance
      const errors = await validate(object, {
        whitelist: true, // Remove extra properties
        forbidNonWhitelisted: true, // Throw error if extra properties are present
        forbidUnknownValues: true, // Prevent unknown values
      });
  
      if (errors.length > 0) {
        const formattedErrors = errors.map((error) => {
          // Extract constraint messages
          const constraints = error.constraints
            ? Object.values(error.constraints)
            : ['Invalid value'];
  
          return {
            property: error.property,
            messages: constraints,
            value: error.value,
          };
        });
  
        this.logger.warn(`Validation failed: ${JSON.stringify(formattedErrors)}`);
        
        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
  
      return object;
    }
  
    private toValidate(metatype: any): boolean {
      const types = [String, Boolean, Number, Array, Object];
      return !types.includes(metatype);
    }
  }