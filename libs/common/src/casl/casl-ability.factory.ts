// libs/common/src/casl/casl-ability.factory.ts
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility, InferSubjects, ExtractSubjectType } from '@casl/ability';
import { UserRole } from '../enums/user-role.enum';
import { Action } from './enums/action.enum';
import { User } from 'apps/user-service/src/schemas/user.schema';
import { Types } from 'mongoose';

export type Subjects = InferSubjects<typeof User> | 'all';
export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Sử dụng kiểm tra type guard
    const hasAdminRole = Array.isArray(user.roles) && 
                        user.roles.some(role => role === UserRole.ADMIN);

    if (hasAdminRole) {
      can(Action.Manage, 'all');
    } else {
      can(Action.Read, User);
      
      if (user._id) {
        can(Action.Update, User, { _id: user._id });
      }
    }

    return build({
      detectSubjectType: (item: Subjects) => {
        if (item === 'all') return item;
        return item.constructor as ExtractSubjectType<Subjects>;
      },
    });
  }
}