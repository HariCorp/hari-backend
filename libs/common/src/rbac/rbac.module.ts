// libs/common/src/rbac/rbac.module.ts
import { Module } from '@nestjs/common';
import { AccessControlFactory } from './access-control.factory';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [AccessControlFactory, RolesGuard],
  exports: [AccessControlFactory, RolesGuard],
})
export class RbacModule {}