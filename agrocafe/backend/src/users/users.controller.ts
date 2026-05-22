import { Controller, Get, Post, UseGuards, Put, Param, Body, Request, ForbiddenException, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DemoBlockGuard } from '../auth/guards/demo-block.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import * as bcrypt from 'bcrypt';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users', 'view')
  async findAll(@Request() req: any) {
    return this.usersService.findAll();
  }

  @UseGuards(DemoBlockGuard)
  @Put(':id/reset-password')
  @RequirePermissions('users', 'manage')
  async resetPassword(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(body.newPassword, salt);
    return this.usersService.updatePassword(id, password_hash);
  }

  @Post()
  @RequirePermissions('users', 'manage')
  async create(@Body() body: any) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(body.password || 'Mudar@123', salt);
    
    return this.usersService.create({
      name: body.name,
      email: body.email,
      password_hash,
      phone: body.phone,
      role_name: body.role_name,
      is_active: body.is_active,
      notes: body.notes,
      permissions: body.permissions || {}
    });
  }

  @Put(':id')
  @RequirePermissions('users', 'manage')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role_name: body.role_name,
      is_active: body.is_active,
      notes: body.notes,
      permissions: body.permissions
    });
  }

  @Put(':id/avatar')
  @RequirePermissions('users', 'manage') // Or maybe the user themselves? For now only admin can upload
  async updateAvatar(@Param('id') id: string, @Body() body: { avatar_base64: string }) {
    return this.usersService.update(id, { avatar_base64: body.avatar_base64 });
  }

  @UseGuards(DemoBlockGuard)
  @Delete(':id')
  @RequirePermissions('users', 'manage')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
