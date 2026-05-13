import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('report')
  async getAuditReport(@Query('farmId') farmId: string) {
    if (!farmId) return { alerts: [] };
    return this.auditService.runAudit(farmId);
  }
}
