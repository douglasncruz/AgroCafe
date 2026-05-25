import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tenantsService: TenantsService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    await this.usersService.updateLastLogin(user.id);
    
    // Super Admin hardcode
    let userPermissions = user.permissions || {};
    let roleName = user.role_name || 'Usuário';
    
    if (user.email === 'douglas.cruz@agrocerradocafe.com.br') {
      roleName = 'Administrador Supremo';
      userPermissions = {
        users: { view: true, edit: true, delete: true },
        farms: { view: true, edit: true, delete: true },
        harvests: { view: true, edit: true, delete: true },
        expenses: { view: true, edit: true, delete: true },
        revenues: { view: true, edit: true, delete: true },
        reports: { view: true, edit: true, delete: true },
        partners: { view: true, edit: true, delete: true },
        stock: { view: true, edit: true, delete: true },
        machines: { view: true, edit: true, delete: true },
        agrochemicals: { view: true, edit: true, delete: true },
        audit: { view: true, edit: true, delete: true },
      };
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      is_demo: user.is_demo,
      permissions: userPermissions,
      role_name: roleName,
      tenant_id: user.tenant_id,
      environment_type: user.tenant?.environment_type || (user.is_demo ? 'demo' : 'real')
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_demo: user.is_demo,
        permissions: userPermissions,
        role_name: roleName,
        avatar_base64: user.avatar_base64,
        phone: user.phone,
        tenant_id: user.tenant_id,
        environment_type: user.tenant?.environment_type || (user.is_demo ? 'demo' : 'real')
      }
    };
  }

  async register(registerDto: any) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(registerDto.password, salt);

    // Create a Tenant for the new user
    const tenant = await this.tenantsService.createTenant(`Organização de ${registerDto.name}`, 'real', false);

    const newUser = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password_hash,
      tenant_id: tenant.id
    });

    return this.login(newUser);
  }
}
