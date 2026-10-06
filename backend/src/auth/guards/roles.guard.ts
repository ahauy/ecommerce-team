import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/schemas/user.schema';

export { UserRole };

export const Role = {
  Admin: UserRole.ADMIN,
  Customer: UserRole.CUSTOMER,
  ADMIN: UserRole.ADMIN,
  CUSTOMER: UserRole.CUSTOMER,
} as const;
export type Role = UserRole;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | string)[]) =>
  SetMetadata(ROLES_KEY, roles);

interface RequestWithUser {
  user?: {
    role?: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Quyền truy cập bị từ chối');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Quyền truy cập bị từ chối');
    }

    return true;
  }
}
