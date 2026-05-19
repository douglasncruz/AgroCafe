import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
  ) {}

  async findAll(farmId: string) {
    return this.partnerRepo.find({ where: { farm: { id: farmId } } });
  }

  async create(dto: any) {
    const partner = this.partnerRepo.create({
      name: dto.name,
      share_percentage: dto.share_percentage,
      farm: { id: dto.farmId } as any
    });
    return this.partnerRepo.save(partner);
  }

  async remove(id: string) {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if(partner) {
      await this.partnerRepo.remove(partner);
    }
    return { success: true };
  }

  async calculateSettlement(farmId: string, harvestId?: string) {
    const partners = await this.findAll(farmId);
    
    const expWhere: any = { farm: { id: farmId } };
    const revWhere: any = { farm: { id: farmId } };

    if (harvestId) {
      expWhere.harvest = { id: harvestId };
      revWhere.harvest = { id: harvestId };
    }

    const expenses = await this.expenseRepo.find({ where: expWhere });
    const revenues = await this.revenueRepo.find({ where: revWhere });

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
      // Match exactly by name
      if (e.payer_name && partnerFinances[e.payer_name]) {
        partnerFinances[e.payer_name].paid += val;
      } else {
        // Track unassigned expenses? Not necessary unless requested, just count to total.
      }
    });

    revenues.forEach(r => {
      const val = Number(r.total_value);
      totalRevenues += val;
      if (r.receiver_name && partnerFinances[r.receiver_name]) {
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
}
