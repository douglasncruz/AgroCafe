import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agrochemical } from './entities/agrochemical.entity';
import { StockService } from '../stock/stock.service';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class AgrochemicalsService {
  constructor(
    @InjectRepository(Agrochemical) private repo: Repository<Agrochemical>,
    private stockService: StockService,
  ) {}

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  async findAll(farmId: string) {
    return this.repo.find({ 
      where: { farm: { id: farmId }, tenant_id: this.getTenantId() },
      order: { application_date: 'DESC' }
    });
  }

  async create(dto: any) {
    const appDate = new Date(dto.application_date);
    const safeDate = new Date(appDate);
    safeDate.setDate(safeDate.getDate() + Number(dto.grace_period_days));

    const record = this.repo.create({
      ...dto,
      recipe_url: dto.recipe_url,
      safe_harvest_date: safeDate,
      farm: { id: dto.farmId } as any
    });
    const saved = await this.repo.save(record);

    // Registrar saída automática no estoque
    try {
      await this.stockService.createTransaction({
        farmId: dto.farmId,
        product_name: dto.product_name,
        type: 'SAIDA',
        quantity: Number(dto.quantity_used),
        unit: 'L',
        date: dto.application_date,
        notes: `Aplicação automática - Talhão: ${dto.plot_applied} | Alvo: ${dto.target_pest}`,
        category: 'Defensivo',
      });
    } catch (e) {
      // Não bloquear o cadastro de defensivo se o estoque falhar
      console.warn('[Stock] Erro ao registrar saída automática:', e.message);
    }

    return saved;
  }

  async remove(id: string) {
    const record = await this.repo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if(record) {
      await this.repo.remove(record);
    }
    return { success: true };
  }
}
