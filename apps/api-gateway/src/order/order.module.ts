import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { RbacModule } from '@app/common';

/**
 * Order module handles all order-related functionality
 * Imports RbacModule for role-based access control
 */
@Module({
  imports: [
    RbacModule, // Import RBAC module for role-based access control
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService], // Export OrderService for use in other modules if needed
})
export class OrderModule {}
