import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { HarvestsService } from './harvests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/harvests')
@UseGuards(JwtAuthGuard)
export class HarvestsController {
  constructor(private readonly harvestsService: HarvestsService) {}

  @Get('farm/:farmId')
  findAll(@Param('farmId') farmId: string) {
    return this.harvestsService.findAllByFarm(farmId);
  }

  @Post('farm/:farmId')
  create(@Param('farmId') farmId: string, @Body('name') name: string) {
    return this.harvestsService.create(farmId, name);
  }

  @Put(':id/set-active/farm/:farmId')
  setActive(@Param('id') id: string, @Param('farmId') farmId: string) {
    return this.harvestsService.setActive(farmId, id);
  }
}
