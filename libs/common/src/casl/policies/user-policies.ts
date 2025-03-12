// libs/common/src/casl/policies/user-policies.ts
import { Action } from '../enums/action.enum';
import { AppAbility } from '../casl-ability.factory';
import { IPolicyHandler } from '../decorators/check-policies.decorator';
import { User } from 'apps/user-service/src/schemas/user.schema';
import { Types } from 'mongoose';

export class ReadUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, User);
  }
}

export class UpdateUserPolicyHandler implements IPolicyHandler {
  constructor(private userId: string) {}

  handle(ability: AppAbility) {
    // Tạo một instance đầy đủ của User
    const userToCheck = new User();
    userToCheck._id = new Types.ObjectId(this.userId); // Chuyển string sang ObjectId
    
    return ability.can(Action.Update, userToCheck);
  }
}

export class CreateUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Create, User);
  }
}

export class DeleteUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Delete, User);
  }
}