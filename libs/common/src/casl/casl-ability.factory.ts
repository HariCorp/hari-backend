// libs/common/src/casl/casl-ability.factory.ts
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, ExtractSubjectType, InferSubjects, MongoAbility } from '@casl/ability';
import { User } from 'apps/user-service/src/schemas/user.schema';
import { Product } from 'apps/api-gateway/src/product/schemas/product.schema';
import { Action } from './enums/action.enum';
import { UserRole } from '../enums/user-role.enum';

// Định nghĩa các đối tượng có thể được áp dụng quyền
type Subjects = InferSubjects<typeof User | typeof Product> | 'all';

// Định nghĩa loại ability
export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Log thông tin user để debug
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/casl-ability.factory.ts:${this.getLineNumber()}] - User roles:`, user.roles);

    if (user.roles && user.roles.includes(UserRole.SUPER_ADMIN)) {
      // SuperAdmin có thể làm mọi thứ
      can(Action.Manage, 'all');
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/casl-ability.factory.ts:${this.getLineNumber()}] - Granted: SuperAdmin full access`);
    } else if (user.roles && user.roles.includes(UserRole.ADMIN)) {
      // Admin có thể đọc mọi thứ
      can(Action.Read, 'all');
      
      // Admin có thể quản lý users (trừ SuperAdmin)
      can([Action.Create, Action.Update, Action.Delete], User, { 
        roles: { $nin: [UserRole.SUPER_ADMIN] } 
      });
      
      // Admin có thể quản lý sản phẩm
      can([Action.Create, Action.Update, Action.Delete], Product);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/casl-ability.factory.ts:${this.getLineNumber()}] - Granted: Admin read all, manage users (except SuperAdmin), manage products`);
    } else if (user.roles && user.roles.includes(UserRole.SELLER)) {
      // Seller có thể đọc thông tin của mình
      can(Action.Read, User, { _id: user.userId });
      can(Action.Update, User, { _id: user.userId });
      
      // Seller có thể quản lý sản phẩm của mình
      can([Action.Create, Action.Read], Product);
      can([Action.Update, Action.Delete], Product, { 
        userId: user.userId 
      });
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/casl-ability.factory.ts:${this.getLineNumber()}] - Granted: Seller read/update self, manage own products`);
    } else {
      // User thông thường
      // Có thể đọc và cập nhật thông tin của mình
      can(Action.Read, User, { _id: user.userId });
      can(Action.Update, User, { _id: user.userId });
      
      // Có thể đọc sản phẩm
      can(Action.Read, Product);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/casl-ability.factory.ts:${this.getLineNumber()}] - Granted: User read/update self, read products`);
    }

    return build({
      // Chuyển đổi _id ObjectId để so sánh với userId (string)
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  // Hàm trợ giúp để lấy số dòng (dùng Error stack)
  private getLineNumber(): number {
    const error = new Error();
    const stack = error.stack?.split('\n')[2]; // Lấy dòng gọi hàm
    const match = stack?.match(/:(\d+):/); // Trích xuất số dòng
    return match ? parseInt(match[1]) : 0;
  }
}