// libs/common/src/rbac/access-control.factory.ts
import { Injectable } from '@nestjs/common';
import { AccessControl } from 'accesscontrol';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AccessControlFactory {
  private ac: AccessControl;

  constructor() {
    this.ac = this.initializeRoles();
  }

  private initializeRoles(): AccessControl {
    const ac = new AccessControl();

    // Super Admin - can do everything
    ac.grant(UserRole.SUPER_ADMIN)
      .createAny('user')
      .readAny('user')
      .updateAny('user')
      .deleteAny('user')
      .createAny('product')
      .readAny('product')
      .updateAny('product')
      .deleteAny('product');

    // Admin - can manage users (except super admins) and all products
    ac.grant(UserRole.ADMIN)
      .createAny('user')
      .readAny('user')
      .updateAny('user')
      .deleteAny('user')
      .createAny('product')
      .readAny('product')
      .updateAny('product')
      .deleteAny('product');

    // Seller - can manage own products and read/update own profile
    ac.grant(UserRole.SELLER)
      .readOwn('user')
      .updateOwn('user')
      .createOwn('product')
      .readAny('product')
      .updateOwn('product')
      .deleteOwn('product');

    // Regular user - can read products and manage own profile
    ac.grant(UserRole.USER)
      .readOwn('user')
      .updateOwn('user')
      .readAny('product');

    return ac;
  }

  /**
   * Get AccessControl instance
   */
  getAccessControl(): AccessControl {
    return this.ac;
  }

  /**
   * Check if a user can perform an action on a resource
   * @param roles User roles
   * @param action Action to perform (create, read, update, delete)
   * @param resource Resource to access (user, product, etc.)
   * @param isOwn Whether the resource belongs to the user
   */
  can(roles: string[], action: string, resource: string, isOwn: boolean = false): boolean {
    // No roles means no access
    if (!roles || roles.length === 0) {
      return false;
    }

    // Format the permission query
    const possession = isOwn ? 'Own' : 'Any';
    const permissionQuery = `${action}${possession}`;

    // Super admin always has access to everything
    if (roles.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check each role for permission
    for (const role of roles) {
      try {
        // Get the permission object for this role, action, and resource
        const permission = this.ac.can(role)[permissionQuery](resource);
        
        // If any role has permission, return true
        if (permission.granted) {
          return true;
        }
      } catch (error) {
        console.error(`Error checking permission for role ${role}: ${error.message}`);
        // Continue checking other roles
      }
    }

    // No role has permission
    return false;
  }
}