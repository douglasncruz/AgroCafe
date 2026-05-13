import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Agrochemical } from '../agrochemicals/entities/agrochemical.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Machine } from '../machines/entities/machine.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Expense) private expRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revRepo: Repository<Revenue>,
    @InjectRepository(Agrochemical) private agroRepo: Repository<Agrochemical>,
    @InjectRepository(Machine) private macRepo: Repository<Machine>,
    @InjectRepository(Maintenance) private maintRepo: Repository<Maintenance>,
  ) {}

  async runAudit(farmId: string) {
    const alerts = [];

    // 1. Auditoria Financeira: Despesas sem Comprovante
    const expensesWithoutReceipt = await this.expRepo.find({ where: { farm: { id: farmId } } });
    const missingExpReceipts = expensesWithoutReceipt.filter(e => !e.receipt_url);
    if (missingExpReceipts.length > 0) {
      alerts.push({
        type: 'FINANCIAL_WARNING',
        severity: 'high',
        title: 'Despesas sem Comprovante Fiscal',
        message: `Foram encontradas ${missingExpReceipts.length} despesas sem nota fiscal anexada. Isso pode gerar glosas na contabilidade.`,
        action: 'Anexar comprovantes no módulo de Despesas.'
      });
    }

    // 2. Auditoria Financeira: Receitas sem Nota
    const revenues = await this.revRepo.find({ where: { farm: { id: farmId } } });
    const missingRevReceipts = revenues.filter(r => !r.receipt_url);
    if (missingRevReceipts.length > 0) {
      alerts.push({
        type: 'FINANCIAL_CRITICAL',
        severity: 'critical',
        title: 'Receitas (Vendas) sem Nota Fiscal',
        message: `Existem ${missingRevReceipts.length} registros de venda de café sem nota fiscal. Risco altíssimo de autuação pela Receita Federal.`,
        action: 'Regularizar notas fiscais no módulo de Receitas.'
      });
    }

    // 3. Auditoria Agronômica: Defensivos sem Receituário ou Operador
    const agrochemicals = await this.agroRepo.find({ where: { farm: { id: farmId } } });
    const missingAgroData = agrochemicals.filter(a => !a.agronomist_recipe || !a.operator_name || !a.recipe_url);
    if (missingAgroData.length > 0) {
      alerts.push({
        type: 'AGRONOMIC_CRITICAL',
        severity: 'critical',
        title: 'Aplicações de Defensivos Irregulares',
        message: `${missingAgroData.length} aplicações foram registradas sem receituário técnico, sem operador identificado ou sem o anexo da receita. Risco de multa do MAPA e embargo da certificação do café.`,
        action: 'Atualizar registros no módulo Defensivos.'
      });
    }

    // 4. Auditoria de Ativos: Manutenções sem comprovante
    const machines = await this.macRepo.find({ where: { farm: { id: farmId } } });
    let missingMaintReceipts = 0;
    for (const machine of machines) {
      const maints = await this.maintRepo.find({ where: { machine: { id: machine.id } } });
      missingMaintReceipts += maints.filter(m => !m.receipt_url).length;
    }
    
    if (missingMaintReceipts > 0) {
      alerts.push({
        type: 'ASSET_WARNING',
        severity: 'medium',
        title: 'Manutenções sem Ordem de Serviço',
        message: `${missingMaintReceipts} manutenções de maquinário não possuem Ordem de Serviço ou Nota Fiscal anexada.`,
        action: 'Auditar frota no módulo Maquinário.'
      });
    }

    // 5. Conformidade: Sucesso
    if (alerts.length === 0) {
      alerts.push({
        type: 'SUCCESS',
        severity: 'low',
        title: 'Conformidade Total',
        message: 'Parabéns! A fazenda está 100% em conformidade fiscal e agronômica. Todos os registros possuem rastreabilidade.',
        action: ''
      });
    }

    return { alerts, timestamp: new Date().toISOString() };
  }
}
