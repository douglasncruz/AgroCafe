import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Expense } from '../expenses/entities/expense.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Machine } from '../machines/entities/machine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Farm, Revenue, Maintenance, Machine])],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
