import { Injectable } from '@nestjs/common';

// Lớp giả để thay thế
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any) {
    return {
      can: () => true,
    };
  }
}

// Export interface giả
export type AppAbility = any;
