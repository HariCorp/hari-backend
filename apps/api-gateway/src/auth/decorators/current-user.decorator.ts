
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu data được cung cấp (ví dụ: @CurrentUser('userId')), trả về thuộc tính cụ thể
    return data ? user?.[data] : user;
  },
);