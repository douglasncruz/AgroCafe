import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Agrochemical } from '../agrochemicals/entities/agrochemical.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Machine } from '../machines/entities/machine.entity';
import { StockItem } from '../stock/entities/stock-item.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Expense) private expRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revRepo: Repository<Revenue>,
    @InjectRepository(Agrochemical) private agroRepo: Repository<Agrochemical>,
    @InjectRepository(Machine) private macRepo: Repository<Machine>,
    @InjectRepository(Maintenance) private maintRepo: Repository<Maintenance>,
    @InjectRepository(StockItem) private stockItemRepo: Repository<StockItem>,
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

    // 5. Auditoria Agronômica: Defensivos em Carência Ativa
    const today = new Date();
    today.setHours(0,0,0,0);
    const activeGracePeriod = agrochemicals.filter(a => {
      const safeDate = new Date(a.safe_harvest_date);
      safeDate.setHours(0,0,0,0);
      return safeDate > today;
    });
    if (activeGracePeriod.length > 0) {
      alerts.push({
        type: 'AGRONOMIC_CRITICAL',
        severity: 'critical',
        title: 'Carência Ativa - Risco de Contaminação',
        message: `Existem ${activeGracePeriod.length} aplicação(ões) de defensivos em período de carência ativo. NÃO realizar colheita nos talhões afetados até a liberação segura.`,
        action: 'Verificar datas seguras para colheita no módulo de Defensivos.'
      });
    }

    // 6. Auditoria Agronômica: Dosagem Elevada
    const highDosageAgro = agrochemicals.filter(a => Number(a.dose_per_hectare) > 5.0);
    if (highDosageAgro.length > 0) {
      alerts.push({
        type: 'AGRONOMIC_WARNING',
        severity: 'medium',
        title: 'Dosagem de Defensivo Elevada',
        message: `Foram detectadas ${highDosageAgro.length} aplicação(ões) de defensivo com dosagem superior a 5.0 L/ha ou Kg/ha.`,
        action: 'Confirmar a recomendação técnica na receita agronômica correspondente.'
      });
    }

    // 7. Auditoria de Ativos: Manutenções de Alto Custo
    let highCostMaintenances = 0;
    for (const machine of machines) {
      const maints = await this.maintRepo.find({ where: { machine: { id: machine.id } } });
      highCostMaintenances += maints.filter(m => Number(m.cost) > 5000.0).length;
    }
    if (highCostMaintenances > 0) {
      alerts.push({
        type: 'ASSET_WARNING',
        severity: 'medium',
        title: 'Manutenções de Alto Custo Detectadas',
        message: `Foram encontradas ${highCostMaintenances} manutenções com custo superior a R$ 5.000,00 cada.`,
        action: 'Auditar notas fiscais e justificativas técnicas com a oficina/provedor.'
      });
    }

    // 8. Auditoria de Estoque: Estoque Negativo (aplicação sem compra)
    const stockItems = await this.stockItemRepo.find({ where: { farm: { id: farmId } } });
    const negativeStock = stockItems.filter(s => Number(s.quantity) < 0);
    if (negativeStock.length > 0) {
      const names = negativeStock.map(s => s.product_name).join(', ');
      alerts.push({
        type: 'STOCK_CRITICAL',
        severity: 'critical',
        title: 'Estoque Negativo - Aplicação sem Compra',
        message: `${negativeStock.length} produto(s) possuem estoque negativo (${names}). Isso indica que defensivos foram aplicados sem registro de compra correspondente.`,
        action: 'Registrar a entrada de compra no módulo Controle de Estoque.'
      });
    }

    // 9. Auditoria de Estoque: Estoque Baixo
    const lowStock = stockItems.filter(s => Number(s.quantity) >= 0 && Number(s.quantity) <= Number(s.min_quantity) && Number(s.min_quantity) > 0);
    if (lowStock.length > 0) {
      const names = lowStock.map(s => `${s.product_name} (${s.quantity} ${s.unit})`).join(', ');
      alerts.push({
        type: 'STOCK_WARNING',
        severity: 'medium',
        title: 'Estoque Baixo de Insumos',
        message: `${lowStock.length} produto(s) estão com estoque abaixo do mínimo recomendado: ${names}.`,
        action: 'Realizar nova compra ou ajustar a quantidade mínima no módulo de Estoque.'
      });
    }

    // 10. Conformidade: Sucesso
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
