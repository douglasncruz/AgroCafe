import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { Farm } from '../farms/entities/farm.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>
  ) {}

  async findAll() {
    return this.expenseRepo.find({ relations: ['farm'], order: { created_at: 'DESC' } });
  }

  async create(createExpenseDto: any) {
    const { farmId, harvestId, ...rest } = createExpenseDto;
    const farm = farmId ? await this.farmRepo.findOne({ where: { id: farmId } }) : null;
    
    const expense = this.expenseRepo.create({
      ...rest,
      farm: farm || undefined,
      harvest: harvestId ? { id: harvestId } : undefined
    });
    return this.expenseRepo.save(expense);
  }

  async remove(id: string) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (expense) {
      await this.expenseRepo.remove(expense);
    }
    return { success: true };
  }
}
