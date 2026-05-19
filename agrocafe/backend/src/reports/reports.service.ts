import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Partner } from '../partners/entities/partner.entity';
import { Harvest } from '../harvests/entities/harvest.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Expense) private expRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revRepo: Repository<Revenue>,
    @InjectRepository(Maintenance) private maintRepo: Repository<Maintenance>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(Harvest) private harvestRepo: Repository<Harvest>,
  ) {}

  /**
   * Gera DRE completo filtrando por SAFRA (modo principal)
   */
  async generateHarvestReport(harvestId: string) {
    const harvest = await this.harvestRepo.findOne({
      where: { id: harvestId },
      relations: ['farm'],
    });
    if (!harvest) throw new NotFoundException('Safra não encontrada.');
    
    const farm = harvest.farm;
    if (!farm) throw new NotFoundException('Fazenda da safra não encontrada.');

    const expenses = await this.expRepo.find({
      where: { harvest: { id: harvestId } },
      relations: ['farm'],
    });
    const revenues = await this.revRepo.find({
      where: { harvest: { id: harvestId } },
      relations: ['farm'],
    });

    const maintenances = await this.maintRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.machine', 'machine')
      .leftJoin('machine.farm', 'f')
      .where('f.id = :farmId', { farmId: farm.id })
      .getMany();

    // Filtrar manutenções pelo período da safra
    const maintFiltered = maintenances.filter(m => {
      if (!harvest.start_date) return true;
      const mDate = new Date(m.date);
      const start = new Date(harvest.start_date);
      const end = harvest.end_date ? new Date(harvest.end_date) : new Date();
      return mDate >= start && mDate <= end;
    });

    const partners = await this.partnerRepo.find({ where: { farm: { id: farm.id } } });

    return this.buildDRE(expenses, revenues, maintFiltered, partners, farm, {
      name: harvest.name,
      year: harvest.year,
      status: harvest.status,
      start_date: harvest.start_date,
      end_date: harvest.end_date,
    });
  }

  /**
   * Gera DRE filtrando por ano (retrocompatibilidade)
   */
  async generateFarmReport(farmId: string, year: string) {
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Fazenda não encontrada');

    const expenses = await this.expRepo.find({ where: { farm: { id: farmId } } });
    const revenues = await this.revRepo.find({ where: { farm: { id: farmId } } });
    const maintenances = await this.maintRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.machine', 'machine')
      .leftJoin('machine.farm', 'f')
      .where('f.id = :farmId', { farmId })
      .getMany();
    const partners = await this.partnerRepo.find({ where: { farm: { id: farmId } } });

    const expYear = expenses.filter(e => new Date(e.date).getFullYear().toString() === year);
    const revYear = revenues.filter(r => new Date(r.date).getFullYear().toString() === year);
    const maintYear = maintenances.filter(m => new Date(m.date).getFullYear().toString() === year);

    return this.buildDRE(expYear, revYear, maintYear, partners, farm, {
      name: `Ano ${year}`,
      year: Number(year),
    });
  }

  /**
   * Comparativo entre duas safras — retorna dados de ambas lado a lado.
   */
  async compareHarvests(harvestId1: string, harvestId2: string) {
    const [report1, report2] = await Promise.all([
      this.generateHarvestReport(harvestId1),
      this.generateHarvestReport(harvestId2),
    ]);

    const variation = {
      grossRevenue: this.calcVariation(report1.dre.grossRevenue, report2.dre.grossRevenue),
      totalCosts: this.calcVariation(report1.dre.totalCosts, report2.dre.totalCosts),
      netProfit: this.calcVariation(report1.dre.netProfit, report2.dre.netProfit),
      sacksSold: this.calcVariation(report1.kpi.sacksSold, report2.kpi.sacksSold),
      costPerSack: this.calcVariation(report1.kpi.costPerSack, report2.kpi.costPerSack),
      costPerHectare: this.calcVariation(report1.kpi.costPerHectare, report2.kpi.costPerHectare),
      averageSackPrice: this.calcVariation(report1.kpi.averageSackPrice, report2.kpi.averageSackPrice),
      profitMargin: {
        absolute: report2.dre.profitMargin - report1.dre.profitMargin,
      },
    };

    return { harvest1: report1, harvest2: report2, variation };
  }

  /**
   * Evolução financeira multi-safra (timeline para gráfico).
   */
  async getHarvestEvolution(farmId: string) {
    const harvests = await this.harvestRepo.find({
      where: { farm: { id: farmId } },
      relations: ['expenses', 'revenues'],
      order: { year: 'ASC', created_at: 'ASC' },
    });

    return harvests.map(h => {
      const totalExpenses = (h.expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
      const totalRevenues = (h.revenues || []).reduce((sum, r) => sum + Number(r.total_value), 0);
      const totalSacks = (h.revenues || []).reduce((sum, r) => sum + Number(r.sacks_sold), 0);

      return {
        id: h.id,
        name: h.name,
        year: h.year,
        status: h.status,
        totalExpenses,
        totalRevenues,
        netProfit: totalRevenues - totalExpenses,
        totalSacks,
        avgPrice: totalSacks > 0 ? totalRevenues / totalSacks : 0,
      };
    });
  }

  // ─── Helpers ───────────────────────────────────────────────

  private buildDRE(
    expenses: Expense[],
    revenues: Revenue[],
    maintenances: Maintenance[],
    partners: Partner[],
    farm: Farm,
    harvestInfo: any,
  ) {
    let grossRevenue = 0;
    let sacksSold = 0;
    revenues.forEach(r => {
      grossRevenue += Number(r.total_value);
      sacksSold += Number(r.sacks_sold);
    });

    const directCosts = {
      insumos: 0,
      mao_de_obra: 0,
      maquinario: 0,
      impostos_taxas: 0,
      outros: 0,
    };

    expenses.forEach(e => {
      const val = Number(e.amount);
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('insumo') || cat.includes('fertilizante') || cat.includes('defensivo'))
        directCosts.insumos += val;
      else if (cat.includes('mão') || cat.includes('mao') || cat.includes('salário') || cat.includes('diária'))
        directCosts.mao_de_obra += val;
      else if (cat.includes('imposto') || cat.includes('taxa'))
        directCosts.impostos_taxas += val;
      else directCosts.outros += val;
    });

    maintenances.forEach(m => {
      directCosts.maquinario += Number(m.cost);
    });

    const totalCosts = Object.values(directCosts).reduce((acc, curr) => acc + curr, 0);
    const netProfit = grossRevenue - totalCosts;

    const area = Number(farm.total_area_hectares);
    const costPerHectare = area > 0 ? totalCosts / area : 0;
    const revenuePerHectare = area > 0 ? grossRevenue / area : 0;
    const costPerSack = sacksSold > 0 ? totalCosts / sacksSold : 0;
    const averageSackPrice = sacksSold > 0 ? grossRevenue / sacksSold : 0;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // Distribuição de Sociedade (Acerto)
    const partnerFinances: Record<string, any> = {};
    partners.forEach(p => {
      partnerFinances[p.name] = {
        name: p.name,
        percentage: Number(p.share_percentage),
        paid: 0,
        received: 0,
      };
    });

    expenses.forEach(e => {
      if (e.payer_name && partnerFinances[e.payer_name]) {
        partnerFinances[e.payer_name].paid += Number(e.amount);
      }
    });

    revenues.forEach(r => {
      if (r.receiver_name && partnerFinances[r.receiver_name]) {
        partnerFinances[r.receiver_name].received += Number(r.total_value);
      }
    });

    const settlement = Object.values(partnerFinances).map(p => {
      const netCashPosition = p.received - p.paid;
      const fairShareProfit = netProfit * (p.percentage / 100);
      const balance = fairShareProfit - netCashPosition;
      return { ...p, fairShareProfit, netCashPosition, balance };
    });

    // Breakdown mensal para gráfico
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = monthNames.map(month => ({ month, despesas: 0, receitas: 0 }));

    expenses.forEach(e => {
      const m = new Date(e.date).getMonth();
      monthlyData[m].despesas += Number(e.amount);
    });
    revenues.forEach(r => {
      const m = new Date(r.date).getMonth();
      monthlyData[m].receitas += Number(r.total_value);
    });

    return {
      farmDetails: { name: farm.name, area, ...harvestInfo },
      dre: { grossRevenue, directCosts, totalCosts, netProfit, profitMargin },
      kpi: { sacksSold, costPerHectare, revenuePerHectare, costPerSack, averageSackPrice },
      settlement,
      monthlyData,
      stats: {
        expenseCount: expenses.length,
        revenueCount: revenues.length,
        maintenanceCount: maintenances.length,
      },
    };
  }

  private calcVariation(prev: number, curr: number) {
    return {
      absolute: curr - prev,
      percentage: prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : curr !== 0 ? 100 : 0,
    };
  }
}
