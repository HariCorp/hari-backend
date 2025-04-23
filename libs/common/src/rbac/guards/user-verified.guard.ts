// libs/common/src/rbac/guards/user-verified.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const VERIFICATION_ERROR_MESSAGE = 'VERIFICATION_ERROR_MESSAGE';

export const VerificationErrorMessage = (message: string) =>
  SetMetadata(VERIFICATION_ERROR_MESSAGE, message);

@Injectable()
export class UserVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy custom error message từ metadata nếu có
    const customErrorMessage = this.reflector.get<string>(
      VERIFICATION_ERROR_MESSAGE,
      context.getHandler(),
    );

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
    if (!user) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này',
      );
    }
    console.log(
      '🔍 ~ canActivate ~ hari-backend/libs/common/src/rbac/guards/user-verified.guard.ts:39 ~ user:',
      user,
    );

    // Kiểm tra xem user đã được xác minh chưa
    console.log(
      '🔍 ~ canActivate ~ hari-backend/libs/common/src/rbac/guards/user-verified.guard.ts:46 ~ user.isVerified:',
      user.isVerified,
    );
    if (!user.isVerified) {
      const defaultMessage =
        'Tài khoản của bạn chưa được xác minh. Vui lòng xác minh tài khoản để tiếp tục.';
      throw new ForbiddenException(customErrorMessage || defaultMessage);
    }

    return true;
  }
}
