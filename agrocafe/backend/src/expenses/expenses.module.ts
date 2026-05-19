import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Expense } from './entities/expense.entity';
import { Farm } from '../farms/entities/farm.entity';
import { HarvestsModule } from '../harvests/harvests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Farm]),
    HarvestsModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
