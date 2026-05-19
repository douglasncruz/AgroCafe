import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Partner } from '../partners/entities/partner.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Expense) private expRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revRepo: Repository<Revenue>,
    @InjectRepository(Maintenance) private maintRepo: Repository<Maintenance>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
  ) {}

  async generateFarmReport(farmId: string, year: string) {
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Fazenda não encontrada');

    // Fetch Data
    const expenses = await this.expRepo.find({ where: { farm: { id: farmId } } });
    const revenues = await this.revRepo.find({ where: { farm: { id: farmId } } });
    const maintenances = await this.maintRepo.createQueryBuilder('m')
      .leftJoinAndSelect('machine.farm', 'farm')
      .where('farm.id = :farmId', { farmId })
      .getMany();
    const partners = await this.partnerRepo.find({ where: { farm: { id: farmId } } });

    // Filter by year if necessary (using startsWith for simple date strings "YYYY-MM-DD")
    const expYear = expenses.filter(e => new Date(e.date).getFullYear().toString() === year);
    const revYear = revenues.filter(r => new Date(r.date).getFullYear().toString() === year);
    const maintYear = maintenances.filter(m => new Date(m.date).getFullYear().toString() === year);

    // 1. DRE (Demonstrativo do Resultado do Exercício)
    let grossRevenue = 0;
    let sacksSold = 0;
    revYear.forEach(r => {
      grossRevenue += Number(r.total_value);
      sacksSold += Number(r.sacks_sold);
    });

    const directCosts = {
      insumos: 0,
      mao_de_obra: 0,
      maquinario: 0,
      impostos_taxas: 0,
      outros: 0
    };

    expYear.forEach(e => {
      const val = Number(e.amount);
      const cat = e.category.toLowerCase();
      if (cat.includes('insumo') || cat.includes('fertilizante') || cat.includes('defensivo')) directCosts.insumos += val;
      else if (cat.includes('mão') || cat.includes('mao') || cat.includes('salário') || cat.includes('diária')) directCosts.mao_de_obra += val;
      else if (cat.includes('imposto') || cat.includes('taxa')) directCosts.impostos_taxas += val;
      else directCosts.outros += val;
    });

    maintYear.forEach(m => {
      directCosts.maquinario += Number(m.cost);
    });

    const totalCosts = Object.values(directCosts).reduce((acc, curr) => acc + curr, 0);
    const netProfit = grossRevenue - totalCosts;

    // 2. KPIs Agro
    const area = Number(farm.total_area_hectares);
    const costPerHectare = area > 0 ? totalCosts / area : 0;
    const revenuePerHectare = area > 0 ? grossRevenue / area : 0;
    const costPerSack = sacksSold > 0 ? totalCosts / sacksSold : 0;
    const averageSackPrice = sacksSold > 0 ? grossRevenue / sacksSold : 0;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // 3. Distribuição de Sociedade (Acerto)
    const partnerFinances: Record<string, any> = {};
    partners.forEach(p => {
      partnerFinances[p.name] = { 
        name: p.name, 
        percentage: Number(p.share_percentage),
        paid: 0, 
        received: 0 
      };
    });

    expYear.forEach(e => {
      if (e.payer_name && partnerFinances[e.payer_name]) {
        partnerFinances[e.payer_name].paid += Number(e.amount);
      }
    });

    revYear.forEach(r => {
      if (r.receiver_name && partnerFinances[r.receiver_name]) {
        partnerFinances[r.receiver_name].received += Number(r.total_value);
      }
    });

    const settlement = Object.values(partnerFinances).map(p => {
      const netCashPosition = p.received - p.paid;
      const fairShareProfit = netProfit * (p.percentage / 100);
      const balance = fairShareProfit - netCashPosition;
      return {
        ...p,
        fairShareProfit,
        netCashPosition,
        balance
      };
    });

    return {
      farmDetails: { name: farm.name, area, year },
      dre: {
        grossRevenue,
        directCosts,
        totalCosts,
        netProfit,
        profitMargin
      },
      kpi: {
        sacksSold,
        costPerHectare,
        revenuePerHectare,
        costPerSack,
        averageSackPrice
      },
      settlement
    };
  }
}
