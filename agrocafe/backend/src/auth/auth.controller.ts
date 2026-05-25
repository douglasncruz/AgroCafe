import { Controller, Post, Body, UnauthorizedException, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SecurityLogsService } from '../security-logs/security-logs.service';
import { requestContext } from '../common/context/request-context';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private securityLogsService: SecurityLogsService
  ) {}

  @Post('login')
  async login(@Body() req: any) {
    const context = requestContext.getStore();
    const user = await this.authService.validateUser(req.email, req.password);
    
    if (!user) {
      await this.securityLogsService.createLog({
        action: 'LOGIN_FAILED',
        moduleName: 'Auth',
        oldValues: { email: req.email },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        status: 'FAILURE'
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.securityLogsService.createLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN_SUCCESS',
      moduleName: 'Auth',
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      status: 'SUCCESS'
    });

    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() req: any) {
    return this.authService.register(req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
