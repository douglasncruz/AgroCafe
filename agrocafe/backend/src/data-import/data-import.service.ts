import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Harvest, HarvestStatus } from '../harvests/entities/harvest.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Partner } from '../partners/entities/partner.entity';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    @InjectRepository(Harvest) private harvestRepo: Repository<Harvest>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
  ) {}

  async importExcel(fileBuffer: Buffer, farmId: string) {
    if (!farmId) {
      throw new BadRequestException('farmId é obrigatório para importação.');
    }

    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) {
      throw new BadRequestException('Fazenda não encontrada.');
    }

    this.logger.log(`Iniciando importação de planilha para a fazenda ${farm.name}`);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });

    const logs = [];
    const errors = [];
    let expensesImported = 0;
    let revenuesImported = 0;

    // 1. Create or ensure Harvests exist for 2020 to 2026
    const harvestYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
    const harvestMap = new Map<number, Harvest>();
    const currentYear = new Date().getFullYear();

    for (const year of harvestYears) {
      let harvest = await this.harvestRepo.findOne({ where: { year, farm: { id: farmId } } });
      if (!harvest) {
        harvest = this.harvestRepo.create({
          name: `Safra ${year}`,
          year: year,
          status: year === currentYear ? HarvestStatus.ABERTA : (year < currentYear ? HarvestStatus.ENCERRADA : HarvestStatus.ARQUIVADA),
          is_active: true,
          farm: farm,
          start_date: new Date(`${year}-01-01`),
          end_date: new Date(`${year}-12-31`),
        });
        await this.harvestRepo.save(harvest);
        logs.push(`Safra ${year} criada automaticamente.`);
      }
      harvestMap.set(year, harvest);
    }

    // Identificar parceiros/sócios (Cache)
    const partners = await this.partnerRepo.find({ where: { farm: { id: farmId } } });
    const partnerNamesMap = new Map(partners.map(p => [p.name.toLowerCase().trim(), p.name]));

    // 2. Process Despesas
    const sheetNames = workbook.SheetNames;
    const despesasSheetName = sheetNames.find(n => n.toLowerCase().includes('despesa'));
    
    if (despesasSheetName) {
      const sheet = workbook.Sheets[despesasSheetName];
      const data: any[] = xlsx.utils.sheet_to_json(sheet);
      
      for (const [index, row] of data.entries()) {
        try {
          // Extração heurística de campos
          const rawDate = row['Data'] || row['DATA'] || row['Data Pgto'] || row['date'];
          const rawDesc = row['Descrição'] || row['Descricao'] || row['Histórico'] || row['historico'] || row['description'];
          const rawCat = row['Categoria'] || row['Classificação'] || row['Tipo'] || 'Outros Custos';
          const rawVal = row['Valor'] || row['Valor (R$)'] || row['Saída'] || row['amount'] || 0;
          const rawPayer = row['Sócio'] || row['Pagador'] || row['Quem Pagou'] || row['Conta'] || '';

          if (!rawDate || !rawDesc) continue; // Pular linhas vazias

          const parsedDate = new Date(rawDate);
          if (isNaN(parsedDate.getTime())) continue;

          const year = parsedDate.getFullYear();
          let targetHarvest = harvestMap.get(year);
          if (!targetHarvest) {
             // Fallback to closest harvest or create
             if (year > 2026) targetHarvest = harvestMap.get(2026);
             else if (year < 2020) targetHarvest = harvestMap.get(2020);
          }

          const parsedVal = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal.toString().replace(/[R$\s\.]/g, '').replace(',', '.'));
          
          if (isNaN(parsedVal) || parsedVal <= 0) continue;

          // Categorização Inteligente (se estiver genérico)
          let category = rawCat;
          const descLower = String(rawDesc).toLowerCase();
          if (descLower.includes('adubo') || descLower.includes('calcário') || descLower.includes('fertilizante')) category = 'Insumos e Fertilizantes';
          else if (descLower.includes('salário') || descLower.includes('diária') || descLower.includes('colheita')) category = 'Mão de Obra';
          else if (descLower.includes('trator') || descLower.includes('combustível') || descLower.includes('peça')) category = 'Manutenção de Maquinário';
          else if (descLower.includes('imposto') || descLower.includes('taxa') || descLower.includes('contador')) category = 'Impostos e Taxas';

          // Checar duplicata
          const exists = await this.expenseRepo.findOne({
            where: {
              date: parsedDate,
              description: String(rawDesc).trim(),
              amount: parsedVal,
              farm: { id: farmId }
            }
          });

          if (!exists && targetHarvest) {
            const exp = this.expenseRepo.create({
              description: String(rawDesc).trim(),
              date: parsedDate,
              amount: parsedVal,
              category: category,
              payer_name: String(rawPayer).trim(),
              farm: farm,
              harvest: targetHarvest,
              status: 'Pago'
            });
            await this.expenseRepo.save(exp);
            expensesImported++;
          }
        } catch (err: any) {
          errors.push(`Erro na linha ${index + 2} da aba Despesas: ${err.message}`);
        }
      }
      logs.push(`${expensesImported} despesas importadas com sucesso.`);
    } else {
      errors.push("Aba de 'Despesas' não encontrada. Certifique-se de que o nome da aba contenha a palavra 'Despesa'.");
    }

    // 3. Process Receitas (Venda Café)
    const vendasSheetName = sheetNames.find(n => n.toLowerCase().includes('venda'));
    if (vendasSheetName) {
      const sheet = workbook.Sheets[vendasSheetName];
      const data: any[] = xlsx.utils.sheet_to_json(sheet);
      
      for (const [index, row] of data.entries()) {
        try {
          const rawDate = row['Data'] || row['DATA'] || row['date'];
          const rawBuyer = row['Comprador'] || row['Cliente'] || row['Armazém'] || 'Comprador Não Identificado';
          const rawSacks = row['Sacas'] || row['Qtd'] || row['Quantidade'] || row['Qtd Sacas'] || 0;
          const rawPrice = row['Preço Saca'] || row['Preço'] || row['Valor/Saca'] || 0;
          const rawTotal = row['Total'] || row['Valor Total'] || row['Valor'] || 0;
          const rawReceiver = row['Sócio'] || row['Recebedor'] || row['Quem Recebeu'] || '';

          if (!rawDate) continue;

          const parsedDate = new Date(rawDate);
          if (isNaN(parsedDate.getTime())) continue;

          const year = parsedDate.getFullYear();
          let targetHarvest = harvestMap.get(year);
          if (!targetHarvest) {
             if (year > 2026) targetHarvest = harvestMap.get(2026);
             else if (year < 2020) targetHarvest = harvestMap.get(2020);
          }

          let sacks = typeof rawSacks === 'number' ? rawSacks : parseFloat(rawSacks.toString().replace(',', '.'));
          let price = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice.toString().replace(/[R$\s\.]/g, '').replace(',', '.'));
          let total = typeof rawTotal === 'number' ? rawTotal : parseFloat(rawTotal.toString().replace(/[R$\s\.]/g, '').replace(',', '.'));

          if (isNaN(sacks)) sacks = 0;
          if (isNaN(price)) price = 0;
          if (isNaN(total)) total = 0;

          if (total === 0 && sacks > 0 && price > 0) total = sacks * price;
          if (price === 0 && sacks > 0 && total > 0) price = total / sacks;

          if (total <= 0) continue; // Pular linhas sem valor

          // Checar duplicata
          const exists = await this.revenueRepo.findOne({
            where: {
              date: parsedDate,
              total_value: total,
              buyer_name: String(rawBuyer).trim(),
              farm: { id: farmId }
            }
          });

          if (!exists && targetHarvest) {
            const rev = this.revenueRepo.create({
              date: parsedDate,
              sacks_sold: sacks,
              price_per_sack: price,
              total_value: total,
              buyer_name: String(rawBuyer).trim(),
              receiver_name: String(rawReceiver).trim(),
              farm: farm,
              harvest: targetHarvest
            });
            await this.revenueRepo.save(rev);
            revenuesImported++;
          }
        } catch (err: any) {
          errors.push(`Erro na linha ${index + 2} da aba Vendas: ${err.message}`);
        }
      }
      logs.push(`${revenuesImported} receitas (Venda Café) importadas com sucesso.`);
    } else {
      errors.push("Aba de 'Venda Café' não encontrada. Certifique-se de que o nome da aba contenha a palavra 'Venda'.");
    }

    this.logger.log(`Importação concluída. Despesas: ${expensesImported}, Receitas: ${revenuesImported}`);
    
    return {
      success: true,
      message: 'Processamento da planilha concluído',
      summary: {
        expensesImported,
        revenuesImported,
      },
      logs,
      errors
    };
  }
}
