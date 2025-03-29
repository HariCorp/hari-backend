// libs/common/src/rbac/decorators/rbac.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RBAC_METADATA_KEY = 'rbac_metadata';

/**
 * RBAC (Role-Based Access Control) decorator
 * 
 * @param action The action to perform (create, read, update, delete)
 * @param resource The resource to access (user, product, etc.)
 * @param possession Whether the resource is owned by the user ('own' or 'any')
 */
export const RBAC = (action: string, resource: string, possession: 'own' | 'any' = 'any') =>
  SetMetadata(RBAC_METADATA_KEY, { action, resource, possession });