import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Machine } from '../machines/entities/machine.entity';

import { Partner } from '../partners/entities/partner.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense) private expenseRepository: Repository<Expense>,
    @InjectRepository(Revenue) private revenueRepository: Repository<Revenue>,
    @InjectRepository(Maintenance) private maintenanceRepo: Repository<Maintenance>,
    @InjectRepository(Machine) private machineRepo: Repository<Machine>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
  ) {}

  async getSummary(farmId?: string, harvestId?: string, partnerId?: string) {
    const expenseQuery = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.farm', 'farm')
      .leftJoinAndSelect('expense.partner', 'partner');

    if (harvestId) {
      expenseQuery
        .leftJoinAndSelect('expense.harvest', 'harvest')
        .where('harvest.id = :harvestId', { harvestId });
    } else if (farmId) {
      expenseQuery.where('farm.id = :farmId', { farmId });
    }

    const revenueQuery = this.revenueRepository.createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.farm', 'farm')
      .leftJoinAndSelect('revenue.partner', 'partner');
    
    if (harvestId) {
      revenueQuery
        .leftJoinAndSelect('revenue.harvest', 'harvest')
        .where('harvest.id = :harvestId', { harvestId });
    } else if (farmId) {
      revenueQuery.where('farm.id = :farmId', { farmId });
    }

    const maintenanceQuery = this.maintenanceRepo.createQueryBuilder('maint')
      .leftJoinAndSelect('maint.machine', 'machine')
      .leftJoin('machine.farm', 'farm');

    if (farmId) {
      maintenanceQuery.where('farm.id = :farmId', { farmId });
    }

    const machineQuery = this.machineRepo.createQueryBuilder('machine')
      .leftJoin('machine.farm', 'farm');

    if (farmId) {
      machineQuery.where('farm.id = :farmId', { farmId });
    }

    // Executa as queries paralelamente para reduzir o tempo de latência no banco de dados (Painel 360)
    const [expenses, revenues, maintenances, machinesCount] = await Promise.all([
      expenseQuery.getMany(),
      revenueQuery.getMany(),
      maintenanceQuery.getMany(),
      machineQuery.getCount()
    ]);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    let monthlyData = new Array(12).fill(0).map((_, index) => ({
      month: monthNames[index],
      despesas: 0,
      receitas: 0,
    }));

    const farmTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    let totalSacas = 0;

    interface PartnerMonthly {
      despesas: number;
      receitas: number;
      saldo: number;
    }
    const partnersMap: Record<string, { despesas: number; receitas: number; saldo: number; monthly: Record<string, PartnerMonthly> }> = {};

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const m = d.getMonth();
      const val = Number(exp.amount);
      monthlyData[m].despesas += val;
      
      const farmName = exp.farm ? exp.farm.name : 'Sem Nome';
      farmTotals[farmName] = (farmTotals[farmName] || 0) + val;

      const catName = exp.category || 'Outros';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + val;

      const pName = exp.partner ? exp.partner.name : exp.payer_name;
      if (pName) {
        if (!partnersMap[pName]) partnersMap[pName] = { despesas: 0, receitas: 0, saldo: 0, monthly: {} };
        partnersMap[pName].despesas += val;
        partnersMap[pName].saldo -= val;
        const mName = monthNames[m];
        if (!partnersMap[pName].monthly[mName]) partnersMap[pName].monthly[mName] = { despesas: 0, receitas: 0, saldo: 0 };
        partnersMap[pName].monthly[mName].despesas += val;
        partnersMap[pName].monthly[mName].saldo -= val;
      }
    });

    maintenances.forEach(maint => {
      const d = new Date(maint.date);
      const m = d.getMonth();
      const val = Number(maint.cost);
      monthlyData[m].despesas += val;
      
      const catName = maint.machine ? `Manutenção: ${maint.machine.name}` : 'Manutenção Máquinas';
      farmTotals[catName] = (farmTotals[catName] || 0) + val;

      categoryTotals['Manutenção Máquinas e Implementos'] = (categoryTotals['Manutenção Máquinas e Implementos'] || 0) + val;
    });

    revenues.forEach(rev => {
      const d = new Date(rev.date);
      const m = d.getMonth();
      const val = Number(rev.total_value);
      monthlyData[m].receitas += val;
      totalSacas += Number(rev.sacks_sold);

      const pName = rev.partner ? rev.partner.name : rev.receiver_name;
      if (pName) {
        if (!partnersMap[pName]) partnersMap[pName] = { despesas: 0, receitas: 0, saldo: 0, monthly: {} };
        partnersMap[pName].receitas += val;
        partnersMap[pName].saldo += val;
        const mName = monthNames[m];
        if (!partnersMap[pName].monthly[mName]) partnersMap[pName].monthly[mName] = { despesas: 0, receitas: 0, saldo: 0 };
        partnersMap[pName].monthly[mName].receitas += val;
        partnersMap[pName].monthly[mName].saldo += val;
      }
    });

    const colors = ["var(--color-farm-500)", "var(--color-coffee-500)", "var(--color-earth-500)", "var(--color-slate-500)", "#ef4444", "#f59e0b"];
    const expensesByCategory = Object.entries(farmTotals)
      .sort((a, b) => b[1] - a[1]) // Sort by value desc
      .slice(0, 6) // Max 6 categories for pie chart
      .map(([name, value], index) => ({
        name: name.includes('Manutenção') ? name : `Despesas: ${name}`,
        value,
        color: colors[index % colors.length]
      }));

    const catColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#64748b", "#84cc16"];
    const expensesByCategorization = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        color: catColors[index % catColors.length]
      }));

    let cashflowData = monthlyData.filter(d => d.despesas > 0 || d.receitas > 0);
    if(cashflowData.length === 0) cashflowData = monthlyData.slice(0, 6);

    const totalDespesas = monthlyData.reduce((acc, curr) => acc + curr.despesas, 0);
    const totalReceitas = monthlyData.reduce((acc, curr) => acc + curr.receitas, 0);

    const partnerSplit = Object.entries(partnersMap).map(([name, data]) => ({ name, ...data }));

    let partnerAcerto = null;
    if (partnerId) {
      const partner = await this.partnerRepo.findOne({ where: { id: partnerId } });
      if (partner && partner.share_percentage) {
        const share = Number(partner.share_percentage) / 100;
        const despesasPagas = expenses
          .filter(e => e.partner?.id === partnerId || e.payer_name === partner.name)
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
        
        const receitasDoSocio = revenues
          .filter(r => r.partner?.id === partnerId || r.receiver_name === partner.name)
          .reduce((acc, curr) => acc + Number(curr.total_value), 0);
        
        const parteTeoricaDespesas = totalDespesas * share;
        const saldoAcerto = despesasPagas - parteTeoricaDespesas;

        partnerAcerto = {
          nome: partner.name,
          percentual: partner.share_percentage,
          totalDespesasFazenda: totalDespesas,
          parteTeoricaDespesas: parteTeoricaDespesas,
          despesasPagas: despesasPagas,
          saldoAcerto: saldoAcerto,
          receitas: receitasDoSocio
        };
      }
    }

    return {
      cashflow: cashflowData,
      expensesByCategory,
      expensesByCategorization,
      totalDespesas,
      totalReceitas,
      lucroEstimado: totalReceitas - totalDespesas,
      custoPorHectare: totalDespesas > 0 ? totalDespesas / 100 : 0,
      totalSacas,
      machinesCount,
      partnerSplit,
      partnerAcerto
    };
  }
}
