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

    const expenses = await expenseQuery.getMany();

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

    const revenues = await revenueQuery.getMany();

    const maintenanceQuery = this.maintenanceRepo.createQueryBuilder('maint')
      .leftJoinAndSelect('maint.machine', 'machine')
      .leftJoin('machine.farm', 'farm');

    if (farmId) {
      maintenanceQuery.where('farm.id = :farmId', { farmId });
    }

    const maintenances = await maintenanceQuery.getMany();

    const machineQuery = this.machineRepo.createQueryBuilder('machine')
      .leftJoin('machine.farm', 'farm');

    if (farmId) {
      machineQuery.where('farm.id = :farmId', { farmId });
    }

    const machinesCount = await machineQuery.getCount();

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    let monthlyData = new Array(12).fill(0).map((_, index) => ({
      month: monthNames[index],
      despesas: 0,
      receitas: 0,
    }));

    const farmTotals: Record<string, number> = {};
    const partnersMap: Record<string, number> = {};
    let totalSacas = 0;

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const m = d.getMonth();
      const val = Number(exp.amount);
      monthlyData[m].despesas += val;
      
      const farmName = exp.farm ? exp.farm.name : 'Sem Nome';
      farmTotals[farmName] = (farmTotals[farmName] || 0) + val;

      const pName = exp.partner ? exp.partner.name : exp.payer_name;
      if (pName) partnersMap[pName] = (partnersMap[pName] || 0) - val;
    });

    maintenances.forEach(maint => {
      const d = new Date(maint.date);
      const m = d.getMonth();
      const val = Number(maint.cost);
      monthlyData[m].despesas += val;
      
      const catName = maint.machine ? `Manutenção: ${maint.machine.name}` : 'Manutenção Máquinas';
      farmTotals[catName] = (farmTotals[catName] || 0) + val;
    });

    revenues.forEach(rev => {
      const d = new Date(rev.date);
      const m = d.getMonth();
      const val = Number(rev.total_value);
      monthlyData[m].receitas += val;
      totalSacas += Number(rev.sacks_sold);

      const pName = rev.partner ? rev.partner.name : rev.receiver_name;
      if (pName) partnersMap[pName] = (partnersMap[pName] || 0) + val;
    });

    let multiplier = 1;
    if (partnerId) {
      const partner = await this.partnerRepo.findOne({ where: { id: partnerId } });
      if (partner && partner.share_percentage) {
        multiplier = Number(partner.share_percentage) / 100;
      }
    }

    // Aplica a proporcionalidade aos dados mensais
    monthlyData = monthlyData.map(d => ({
      month: d.month,
      despesas: d.despesas * multiplier,
      receitas: d.receitas * multiplier
    }));

    const colors = ["var(--color-farm-500)", "var(--color-coffee-500)", "var(--color-earth-500)", "var(--color-slate-500)", "#ef4444", "#f59e0b"];
    const expensesByCategory = Object.entries(farmTotals)
      .sort((a, b) => b[1] - a[1]) // Sort by value desc
      .slice(0, 6) // Max 6 categories for pie chart
      .map(([name, value], index) => ({
        name: name.includes('Manutenção') ? name : `Despesas: ${name}`,
        value: value * multiplier,
        color: colors[index % colors.length]
      }));

    let cashflowData = monthlyData.filter(d => d.despesas > 0 || d.receitas > 0);
    if(cashflowData.length === 0) cashflowData = monthlyData.slice(0, 6);

    const totalDespesas = monthlyData.reduce((acc, curr) => acc + curr.despesas, 0);
    const totalReceitas = monthlyData.reduce((acc, curr) => acc + curr.receitas, 0);

    const partnerSplit = Object.entries(partnersMap).map(([name, value]) => ({ name, value }));

    return {
      cashflowData,
      expensesByCategory,
      totalDespesas,
      totalReceitas,
      lucroEstimado: totalReceitas - totalDespesas,
      custoPorHectare: totalDespesas > 0 ? totalDespesas / 100 : 0, // Custo por hectare geralmente não se rateia, mas o painel divide pela mesma área, então o custo proporcional faz sentido
      totalSacas: totalSacas * multiplier,
      machinesCount,
      partnerSplit // Mantemos o balanço físico inteiro para o sócio entender o ecossistema financeiro
    };
  }
}
