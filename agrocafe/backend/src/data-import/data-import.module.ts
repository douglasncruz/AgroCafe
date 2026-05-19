import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { Harvest } from '../harvests/entities/harvest.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Partner } from '../partners/entities/partner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Harvest, Expense, Revenue, Farm, Partner])
  ],
  controllers: [DataImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
