import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async getSummary(
    @Query('harvestId') harvestId?: string,
    @Query('farmId') farmId?: string,
    @Query('partnerId') partnerId?: string,
  ) {
    return this.dashboardService.getSummary(farmId, harvestId, partnerId);
  }
}
