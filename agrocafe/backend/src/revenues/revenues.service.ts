import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revenue } from './entities/revenue.entity';
import { Farm } from '../farms/entities/farm.entity';
import { HarvestValidationService } from '../harvests/harvest-validation.service';

@Injectable()
export class RevenuesService {
  constructor(
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    private harvestValidation: HarvestValidationService,
  ) {}

  async findAll() {
    return this.revenueRepo.find({
      relations: ['farm', 'harvest'],
      order: { date: 'DESC' },
    });
  }

  async findByHarvest(harvestId: string) {
    return this.revenueRepo.find({
      where: { harvest: { id: harvestId } },
      relations: ['farm', 'harvest'],
      order: { date: 'DESC' },
    });
  }

  async create(createDto: any) {
    const { farmId, harvestId, ...rest } = createDto;

    // ⚡ REGRA CRÍTICA: Validar safra obrigatória e aberta
    const harvest = await this.harvestValidation.validateForFinancialEntry(harvestId);

    // Validar fazenda
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (farmId && !farm) {
      throw new BadRequestException('Fazenda não encontrada.');
    }

    // Server-side calculation to ensure data integrity
    const sacks = Number(rest.sacks_sold);
    const price = Number(rest.price_per_sack);

    if (isNaN(sacks) || sacks <= 0) {
      throw new BadRequestException('A quantidade de sacas deve ser maior que zero.');
    }
    if (isNaN(price) || price <= 0) {
      throw new BadRequestException('O preço por saca deve ser maior que zero.');
    }

    const total = sacks * price;

    const revenue = this.revenueRepo.create({
      date: rest.date,
      sacks_sold: sacks,
      price_per_sack: price,
      total_value: total,
      buyer_name: rest.buyer_name,
      receiver_name: rest.receiver_name,
      receipt_url: rest.receipt_url,
      farm: farm || undefined,
      harvest: { id: harvest.id },
    });
    return this.revenueRepo.save(revenue);
  }

  async remove(id: string) {
    const revenue = await this.revenueRepo.findOne({
      where: { id },
      relations: ['harvest'],
    });

    if (!revenue) {
      throw new BadRequestException('Receita/venda não encontrada.');
    }

    // Verificar se a safra vinculada permite exclusão
    if (revenue.harvest) {
      await this.harvestValidation.validateForFinancialEntry(revenue.harvest.id);
    }

    await this.revenueRepo.remove(revenue);
    return { success: true, message: 'Venda removida com sucesso.' };
  }
}
