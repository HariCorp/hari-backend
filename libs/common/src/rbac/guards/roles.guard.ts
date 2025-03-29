// libs/common/src/rbac/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlFactory } from '../access-control.factory';
import { RBAC_METADATA_KEY } from '../decorators/rbac.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControlFactory: AccessControlFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy metadata RBAC từ route handler
    const rbacMetadata = this.reflector.get(
        RBAC_METADATA_KEY,
        context.getHandler(),
      ) || {};
      
      // Kiểm tra xem có đủ thông tin cần thiết không
      if (!rbacMetadata.action || !rbacMetadata.resource) {
        // Xử lý khi thiếu thông tin quan trọng
        throw new Error('RBAC metadata missing required properties');
      }
      
      const action = rbacMetadata.action;
      const resource = rbacMetadata.resource;
      const possession = rbacMetadata.possession || 'any';

    // Sử dụng các biến đã được định kiểu đúng
    const isOwn = possession === 'own';

    // Lấy user từ request (HTTP) hoặc context (Kafka)
    let user;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      user = request.user;
    } else if (context.getType() === 'rpc') {
      const rpcContext = context.switchToRpc();
      const data = rpcContext.getData();
      user = data?.user || data?.metadata?.user;
    }

    // Không có user nghĩa là không được phép
    if (!user || !user.roles) {
      throw new ForbiddenException('Bạn không có quyền truy cập vào tài nguyên này');
    }

    // Kiểm tra xem user có quyền cần thiết không
    const hasPermission = this.accessControlFactory.can(
      user.roles,
      action,
      resource,
      isOwn
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Bạn không có quyền ${action} ${resource} này`);
    }

    return true;
  }
}