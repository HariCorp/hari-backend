// libs/common/src/casl/guards/policies.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { CHECK_POLICIES_KEY, PolicyHandler } from '../decorators/check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<PolicyHandler[]>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    ) || [];

    if (policyHandlers.length === 0) {
      return true; // Không có policy áp dụng
    }

    // Lấy người dùng từ request (HTTP)
    let user;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      user = request.user;
    } 
    // Hoặc từ context của Kafka
    else if (context.getType() === 'rpc') {
      const rpcContext = context.switchToRpc();
      const data = rpcContext.getData();
      user = data?.user || data?.metadata?.user;
    }

    if (!user) {
      return false; // Không tìm thấy user
    }

    // Tạo ability cho user
    const ability = this.caslAbilityFactory.createForUser(user);

    // Kiểm tra tất cả policies
    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: any) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}