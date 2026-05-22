import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DemoBlockGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user && user.is_demo) {
      throw new ForbiddenException('Funcionalidade restrita na versão de demonstração. Fale com nossos consultores!');
    }
    
    return true;
  }
}
