import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
  ) {}

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  async findAll(farmId: string) {
    return this.partnerRepo.find({ where: { farm: { id: farmId }, tenant_id: this.getTenantId() } });
  }

  async create(dto: any) {
    const partner = this.partnerRepo.create({
      name: dto.name,
      share_percentage: dto.share_percentage,
      is_active: dto.is_active !== undefined ? dto.is_active : true,
      contact_info: dto.contact_info,
      notes: dto.notes,
      farm: { id: dto.farmId } as any
    });
    return this.partnerRepo.save(partner);
  }

  async update(id: string, dto: any) {
    const partner = await this.partnerRepo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if (!partner) throw new NotFoundException('Sócio não encontrado.');
    
    Object.assign(partner, {
      name: dto.name ?? partner.name,
      share_percentage: dto.share_percentage ?? partner.share_percentage,
      is_active: dto.is_active ?? partner.is_active,
      contact_info: dto.contact_info ?? partner.contact_info,
      notes: dto.notes ?? partner.notes
    });
    
    return this.partnerRepo.save(partner);
  }

  async remove(id: string) {
    const partner = await this.partnerRepo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if(partner) {
      await this.partnerRepo.remove(partner);
    }
    return { success: true };
  }

  async calculateSettlement(farmId: string, harvestId?: string) {
    const partners = await this.findAll(farmId);
    
    const expWhere: any = { farm: { id: farmId }, tenant_id: this.getTenantId() };
    const revWhere: any = { farm: { id: farmId }, tenant_id: this.getTenantId() };

    if (harvestId) {
      expWhere.harvest = { id: harvestId };
      revWhere.harvest = { id: harvestId };
    }

    const expenses = await this.expenseRepo.find({ where: expWhere, relations: ['partner'] });
    const revenues = await this.revenueRepo.find({ where: revWhere, relations: ['partner'] });

    let totalExpenses = 0;
    let totalRevenues = 0;

    const partnerFinances: Record<string, { name: string, paid: number, received: number, percentage: number }> = {};
    
    // Initialize map
    partners.forEach(p => {
      partnerFinances[p.name] = { name: p.name, paid: 0, received: 0, percentage: Number(p.share_percentage) };
    });

    expenses.forEach(e => {
      const val = Number(e.amount);
      totalExpenses += val;
      // Match by relation ID or fallback to payer_name for legacy
      if (e.partner && partnerFinances[e.partner.name]) {
        partnerFinances[e.partner.name].paid += val;
      } else if (e.payer_name && partnerFinances[e.payer_name]) {
        partnerFinances[e.payer_name].paid += val;
      } else {
        // Track unassigned expenses? Not necessary unless requested, just count to total.
      }
    });

    revenues.forEach(r => {
      const val = Number(r.total_value);
      totalRevenues += val;
      if (r.partner && partnerFinances[r.partner.name]) {
        partnerFinances[r.partner.name].received += val;
      } else if (r.receiver_name && partnerFinances[r.receiver_name]) {
        partnerFinances[r.receiver_name].received += val;
      }
    });

    const netProfit = totalRevenues - totalExpenses;
    
    const settlement = Object.values(partnerFinances).map(p => {
      const netCashPosition = p.received - p.paid; // How much money they hold
      const fairShareProfit = netProfit * (p.percentage / 100);
      
      const balance = fairShareProfit - netCashPosition;

      return {
        ...p,
        fairShareProfit,
        netCashPosition,
        balance // Positive means "Has to receive", Negative means "Has to pay"
      };
    });

    return { totalExpenses, totalRevenues, netProfit, settlement };
  }

  async getStatement(partnerId: string, harvestId?: string) {
    const partner = await this.partnerRepo.findOne({ where: { id: partnerId, tenant_id: this.getTenantId() } });
    if (!partner) throw new NotFoundException('Sócio não encontrado.');

    const expWhere: any = { partner: { id: partnerId }, tenant_id: this.getTenantId() };
    const revWhere: any = { partner: { id: partnerId }, tenant_id: this.getTenantId() };

    if (harvestId) {
      expWhere.harvest = { id: harvestId };
      revWhere.harvest = { id: harvestId };
    }

    const expenses = await this.expenseRepo.find({ 
      where: expWhere,
      relations: ['harvest'],
      order: { date: 'DESC' }
    });
    
    const revenues = await this.revenueRepo.find({ 
      where: revWhere,
      relations: ['harvest'],
      order: { date: 'DESC' }
    });

    const statement = [
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense',
        date: e.date,
        description: e.description,
        category: e.category,
        amount: Number(e.amount),
        harvest: e.harvest?.name || 'Geral'
      })),
      ...revenues.map(r => ({
        id: r.id,
        type: 'revenue',
        date: r.date,
        description: `Venda Café - ${r.buyer_name || 'Geral'}`,
        category: 'Receita',
        amount: Number(r.total_value),
        harvest: r.harvest?.name || 'Geral'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPaid = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalReceived = revenues.reduce((sum, r) => sum + Number(r.total_value), 0);

    return {
      partner,
      totalPaid,
      totalReceived,
      netCash: totalReceived - totalPaid,
      statement
    };
  }
}
