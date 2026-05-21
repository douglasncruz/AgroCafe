import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { Farm } from '../farms/entities/farm.entity';
import { HarvestValidationService } from '../harvests/harvest-validation.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    private harvestValidation: HarvestValidationService,
  ) {}

  async findAll() {
    return this.expenseRepo.find({
      relations: ['farm', 'harvest'],
      order: { created_at: 'DESC' },
    });
  }

  async findByHarvest(harvestId: string) {
    return this.expenseRepo.find({
      where: { harvest: { id: harvestId } },
      relations: ['farm', 'harvest'],
      order: { date: 'DESC' },
    });
  }

  async create(createExpenseDto: any) {
    const { farmId, harvestId, ...rest } = createExpenseDto;

    // ⚡ REGRA CRÍTICA: Validar safra obrigatória e aberta
    const harvest = await this.harvestValidation.validateForFinancialEntry(harvestId);

    // Validar fazenda
    const farm = farmId ? await this.farmRepo.findOne({ where: { id: farmId } }) : null;
    if (farmId && !farm) {
      throw new BadRequestException('Fazenda não encontrada.');
    }

    // Validar campos obrigatórios
    if (!rest.description || !rest.amount || !rest.date || !rest.category) {
      throw new BadRequestException('Descrição, valor, data e categoria são obrigatórios.');
    }

    const amount = Number(rest.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('O valor da despesa deve ser maior que zero.');
    }

    const expense = this.expenseRepo.create({
      ...rest,
      amount,
      farm: farm || undefined,
      harvest: { id: harvest.id },
    });
    return this.expenseRepo.save(expense);
  }

  async update(id: string, updateDto: any) {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      relations: ['harvest'],
    });

    if (!expense) throw new BadRequestException('Despesa não encontrada.');

    // Verificar se a safra está aberta
    if (expense.harvest) {
      await this.harvestValidation.validateForFinancialEntry(expense.harvest.id);
    }

    // Se estiver mudando de safra, validar a nova safra
    if (updateDto.harvestId && updateDto.harvestId !== expense.harvest?.id) {
      await this.harvestValidation.validateForFinancialEntry(updateDto.harvestId);
      expense.harvest = { id: updateDto.harvestId } as any;
    }

    if (updateDto.farmId) {
      expense.farm = { id: updateDto.farmId } as any;
    }

    if (updateDto.description !== undefined) expense.description = updateDto.description;
    if (updateDto.category !== undefined) expense.category = updateDto.category;
    if (updateDto.date !== undefined) expense.date = updateDto.date;
    if (updateDto.amount !== undefined) expense.amount = Number(updateDto.amount);
    if (updateDto.payer_name !== undefined) expense.payer_name = updateDto.payer_name;
    if (updateDto.receipt_url !== undefined) expense.receipt_url = updateDto.receipt_url;

    return this.expenseRepo.save(expense);
  }

  async remove(id: string) {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      relations: ['harvest'],
    });

    if (!expense) {
      throw new BadRequestException('Despesa não encontrada.');
    }

    // Verificar se a safra vinculada permite exclusão
    if (expense.harvest) {
      await this.harvestValidation.validateForFinancialEntry(expense.harvest.id);
    }

    await this.expenseRepo.remove(expense);
    return { success: true, message: 'Despesa removida com sucesso.' };
  }
}
