// libs/common/src/casl/guards/policies.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { CHECK_POLICIES_KEY, PolicyHandler } from '../decorators/check-policies.decorator';
import { ForbiddenError } from '@casl/ability';

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

    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - Policy handlers found:`, policyHandlers.length);

    if (policyHandlers.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - No policies applied, access granted`);
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
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - No user found in context`);
      throw new ForbiddenException('You are not authorized to access this resource');
    }

    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - User retrieved:`, user);

    // Tạo ability cho user
    const ability = this.caslAbilityFactory.createForUser(user);
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - Ability created for user:`, ability.rules);

    try {
      // Kiểm tra tất cả policies
      const canActivate = policyHandlers.every((handler) =>
        this.execPolicyHandler(handler, ability),
      );

      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - Policy check result:`, canActivate);

      if (!canActivate) {
        throw new ForbiddenException('You are not authorized to perform this action');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - ForbiddenError:`, error.message);
        throw new ForbiddenException(error.message);
      }
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - Unexpected error:`, error);
      throw error;
    }
  }

  private execPolicyHandler(handler: PolicyHandler, ability: any) {
    const result = typeof handler === 'function' ? handler(ability) : handler.handle(ability);
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/guards/policies.guard.ts:${this.getLineNumber()}] - Policy handler executed, result:`, result);
    return result;
  }

  // Hàm trợ giúp để lấy số dòng (dùng Error stack)
  private getLineNumber(): number {
    const error = new Error();
    const stack = error.stack?.split('\n')[2]; // Lấy dòng gọi hàm
    const match = stack?.match(/:(\d+):/); // Trích xuất số dòng
    return match ? parseInt(match[1]) : 0;
  }
}