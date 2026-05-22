import { Controller, Get, Post, Put, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DemoBlockGuard } from '../auth/guards/demo-block.guard';

@Controller('api/farms')
@UseGuards(JwtAuthGuard)
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Get()
  findAll() {
    return this.farmsService.findAll();
  }

  @Post()
  create(@Body() createFarmDto: any, @Request() req: any) {
    return this.farmsService.create(createFarmDto, req.user.userId);
  }

  @UseGuards(DemoBlockGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.farmsService.remove(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateFarmDto: any, @Request() req: any) {
    return this.farmsService.update(id, updateFarmDto, req.user.userId);
  }
}
