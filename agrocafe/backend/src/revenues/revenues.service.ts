import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revenue } from './entities/revenue.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Partner } from '../partners/entities/partner.entity';
import { HarvestValidationService } from '../harvests/harvest-validation.service';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class RevenuesService {
  constructor(
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    private harvestValidation: HarvestValidationService,
  ) {}

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  async findAll() {
    return this.revenueRepo.find({
      where: { tenant_id: this.getTenantId() },
      relations: ['farm', 'harvest', 'partner'],
      order: { date: 'DESC' },
    });
  }

  async findByHarvest(harvestId: string) {
    return this.revenueRepo.find({
      where: { harvest: { id: harvestId }, tenant_id: this.getTenantId() },
      relations: ['farm', 'harvest', 'partner'],
      order: { date: 'DESC' },
    });
  }

  async create(createDto: any) {
    const { farmId, harvestId, partnerId, ...rest } = createDto;

    // ⚡ REGRA CRÍTICA: Validar safra obrigatória e aberta
    const harvest = await this.harvestValidation.validateForFinancialEntry(harvestId);

    // Validar fazenda
    const farm = await this.farmRepo.findOne({ where: { id: farmId, tenant_id: this.getTenantId() } });
    if (farmId && !farm) {
      throw new BadRequestException('Fazenda não encontrada.');
    }

    // Validar parceiro (opcional)
    let partner = null;
    if (partnerId) {
      partner = await this.partnerRepo.findOne({ where: { id: partnerId, tenant_id: this.getTenantId() } });
      if (!partner) {
        throw new BadRequestException('Sócio não encontrado.');
      }
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
      receiver_name: rest.receiver_name || partner?.name,
      receipt_url: rest.receipt_url,
      farm: farm || undefined,
      harvest: { id: harvest.id },
      partner: partner || undefined,
    });
    return this.revenueRepo.save(revenue);
  }

  async remove(id: string) {
    const revenue = await this.revenueRepo.findOne({
      where: { id, tenant_id: this.getTenantId() },
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
