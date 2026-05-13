import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('agro')
  getAgroReport(
    @Query('farmId') farmId: string,
    @Query('year') year: string
  ) {
    return this.reportsService.generateFarmReport(farmId, year || new Date().getFullYear().toString());
  }
}
