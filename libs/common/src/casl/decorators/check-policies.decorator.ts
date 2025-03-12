// libs/common/src/casl/decorators/check-policies.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../casl-ability.factory';

export const CHECK_POLICIES_KEY = 'check_policy';

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandler = IPolicyHandler | ((ability: AppAbility) => boolean);

export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);