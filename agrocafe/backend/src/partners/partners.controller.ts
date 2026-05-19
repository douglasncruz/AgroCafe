import { Controller, Get, Post, Put, Body, Param, UseGuards, Delete, Query } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll(@Query('farmId') farmId: string) {
    if(!farmId) return [];
    return this.partnersService.findAll(farmId);
  }

  @Post()
  create(@Body() dto: any) {
    return this.partnersService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.partnersService.update(id, dto);
  }

  @Get(':id/statement')
  getStatement(
    @Param('id') id: string,
    @Query('harvestId') harvestId?: string
  ) {
    return this.partnersService.getStatement(id, harvestId);
  }

  @Get('settlement')
  getSettlement(
    @Query('farmId') farmId: string,
    @Query('harvestId') harvestId: string,
  ) {
    return this.partnersService.calculateSettlement(farmId, harvestId);
  }
}
