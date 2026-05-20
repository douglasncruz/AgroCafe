import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Agrochemical } from '../agrochemicals/entities/agrochemical.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Machine } from '../machines/entities/machine.entity';
import { StockItem } from '../stock/entities/stock-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Revenue, Agrochemical, Maintenance, Machine, StockItem])],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
