import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(@Query('farmId') farmId: string) {
    if (!farmId) return [];
    return this.stockService.findAll(farmId);
  }

  @Get('transactions')
  findAllTransactions(@Query('farmId') farmId: string) {
    if (!farmId) return [];
    return this.stockService.findAllTransactions(farmId);
  }

  @Post('transaction')
  createTransaction(@Body() dto: any) {
    return this.stockService.createTransaction(dto);
  }
}
