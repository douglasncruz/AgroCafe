import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * DRE por ano (retrocompatibilidade).
   */
  @Get('agro')
  getAgroReport(
    @Query('farmId') farmId: string,
    @Query('year') year: string,
  ) {
    return this.reportsService.generateFarmReport(farmId, year || new Date().getFullYear().toString());
  }

  /**
   * DRE por Safra — modo principal.
   */
  @Get('harvest/:harvestId')
  getHarvestReport(@Param('harvestId') harvestId: string) {
    return this.reportsService.generateHarvestReport(harvestId);
  }

  /**
   * Comparativo entre duas safras.
   */
  @Get('compare')
  compareHarvests(
    @Query('harvest1') harvest1: string,
    @Query('harvest2') harvest2: string,
  ) {
    return this.reportsService.compareHarvests(harvest1, harvest2);
  }

  /**
   * Evolução financeira ao longo das safras (timeline).
   */
  @Get('evolution/:farmId')
  getHarvestEvolution(@Param('farmId') farmId: string) {
    return this.reportsService.getHarvestEvolution(farmId);
  }
}
