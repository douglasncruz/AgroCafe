import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Partner } from '../partners/entities/partner.entity';
import { Harvest } from '../harvests/entities/harvest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Revenue, Maintenance, Farm, Partner, Harvest])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
