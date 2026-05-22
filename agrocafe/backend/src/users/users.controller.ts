import { Controller, Get, UseGuards, Put, Param, Body, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DemoBlockGuard } from '../auth/guards/demo-block.guard';
import * as bcrypt from 'bcrypt';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req: any) {
    if (req.user.email !== 'admin@agrocafe.com.br') {
      throw new ForbiddenException('Apenas o administrador pode acessar a lista de usuários.');
    }
    return this.usersService.findAll();
  }

  @UseGuards(DemoBlockGuard)
  @Put(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    if (req.user.email !== 'admin@agrocafe.com.br') {
      throw new ForbiddenException('Apenas o administrador pode resetar senhas.');
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(body.newPassword, salt);
    return this.usersService.updatePassword(id, password_hash);
  }
}
