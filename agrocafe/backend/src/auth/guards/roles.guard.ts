import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<{ module: string; action: string }>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    // O usuário douglas.cruz@agrocerradocafe.com.br é o Administrador Supremo
    if (user.email === 'douglas.cruz@agrocerradocafe.com.br') {
      return true;
    }

    // Verifica permissões se não for super admin
    const userPermissions = user.permissions || {};
    const modulePerms = userPermissions[requiredPermission.module];

    if (!modulePerms || modulePerms[requiredPermission.action] !== true) {
      throw new ForbiddenException(`Você não possui permissão para ${requiredPermission.action} no módulo ${requiredPermission.module}.`);
    }

    return true;
  }
}
