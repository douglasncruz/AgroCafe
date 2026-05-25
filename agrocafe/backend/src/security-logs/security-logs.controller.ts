import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SecurityLogsService } from './security-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('security-logs')
@UseGuards(JwtAuthGuard)
export class SecurityLogsController {
  constructor(private readonly securityLogsService: SecurityLogsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.securityLogsService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.securityLogsService.getStats();
  }
}
