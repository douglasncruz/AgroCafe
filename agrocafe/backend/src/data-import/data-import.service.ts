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

  private async getOrCreateHarvest(year: number, farm: Farm): Promise<Harvest> {
    let harvest = await this.harvestRepo.findOne({ where: { year, farm: { id: farm.id } } });
    if (!harvest) {
      const currentYear = new Date().getFullYear();
      let status = HarvestStatus.ARQUIVADA;
      if (year === currentYear) {
        status = HarvestStatus.ABERTA;
      } else if (year < currentYear) {
        status = HarvestStatus.ENCERRADA;
      }
      
      harvest = this.harvestRepo.create({
        name: `Safra ${year}`,
        year: year,
        status: status,
        is_active: true,
        farm: farm,
        start_date: new Date(`${year}-01-01`),
        end_date: new Date(`${year}-12-31`),
      });
      harvest = await this.harvestRepo.save(harvest);
      this.logger.log(`Safra ${year} criada automaticamente para a fazenda ${farm.name}.`);
    }
    return harvest;
  }

  private async getOrCreatePartner(name: string, farm: Farm): Promise<Partner | null> {
    const formattedName = name.trim();
    if (!formattedName) return null;

    let partner = await this.partnerRepo.findOne({ where: { name: formattedName, farm: { id: farm.id } } });
    if (!partner) {
      partner = this.partnerRepo.create({
        name: formattedName,
        share_percentage: 50, // Default 50% based on assumption of 2 partners
        farm: farm,
        is_active: true
      });
      partner = await this.partnerRepo.save(partner);
      this.logger.log(`Sócio ${formattedName} criado automaticamente para a fazenda ${farm.name} com 50% de participação.`);
    }
    return partner;
  }

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

    const logs: string[] = [];
    const errors: string[] = [];
    let expensesImported = 0;
    let revenuesImported = 0;

    const sheetNames = workbook.SheetNames;

    // 1. Processar Despesas pelas abas anuais ("Ano XXXX - Café")
    const despesasSheets = sheetNames.filter(
      n => n.toLowerCase().includes('ano') && (n.toLowerCase().includes('café') || n.toLowerCase().includes('cafe'))
    );

    if (despesasSheets.length > 0) {
      const monthsMap = [
        { name: 'janeiro', index: 1 },
        { name: 'fevereiro', index: 2 },
        { name: 'março', index: 3 },
        { name: 'marco', index: 3 },
        { name: 'abril', index: 4 },
        { name: 'maio', index: 5 },
        { name: 'junho', index: 6 },
        { name: 'julho', index: 7 },
        { name: 'agosto', index: 8 },
        { name: 'setembro', index: 9 },
        { name: 'outubro', index: 10 },
        { name: 'novembro', index: 11 },
        { name: 'dezembro', index: 12 }
      ];

      for (const sheetName of despesasSheets) {
        const yearMatch = sheetName.match(/(\d{4})/);
        if (!yearMatch) continue;

        const year = parseInt(yearMatch[1], 10);
        const targetHarvest = await this.getOrCreateHarvest(year, farm);

        const sheet = workbook.Sheets[sheetName];
        const data: any[] = xlsx.utils.sheet_to_json(sheet);

        for (const [index, row] of data.entries()) {
          try {
            const payerKey = Object.keys(row).find(
              k => k.toLowerCase().includes('pagou') || k.toLowerCase().includes('socio') || k.toLowerCase().includes('quem')
            );
            const descKey = Object.keys(row).find(
              k => k.toLowerCase().includes('despesa') || k.toLowerCase().includes('descri')
            );

            const rawPayer = payerKey ? String(row[payerKey]).trim() : '';
            const rawDesc = descKey ? String(row[descKey]).trim() : '';

            if (!rawDesc || !rawPayer) continue;
            if (rawDesc.toLowerCase() === 'totais' || rawDesc.toLowerCase() === 'total') continue;

            const targetPartner = await this.getOrCreatePartner(rawPayer, farm);

            // Processar cada mês
            for (const month of monthsMap) {
              const monthKey = Object.keys(row).find(k => k.toLowerCase().trim() === month.name);
              if (!monthKey) continue;

              const rawVal = row[monthKey];
              if (rawVal === undefined || rawVal === null || rawVal === '') continue;

              const parsedVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[R$\s\.]/g, '').replace(',', '.'));
              if (isNaN(parsedVal) || parsedVal <= 0) continue;

              const dateStr = `${year}-${String(month.index).padStart(2, '0')}-15`;
              const parsedDate = new Date(dateStr);

              // Categorização Inteligente
              let category = 'Outros Custos';
              const descLower = rawDesc.toLowerCase();
              if (descLower.includes('adubo') || descLower.includes('calcário') || descLower.includes('fertilizante') || descLower.includes('defensiv') || descLower.includes('quimico')) {
                category = 'Insumos e Fertilizantes';
              } else if (descLower.includes('salário') || descLower.includes('diária') || descLower.includes('colheita') || descLower.includes('mão de obra') || descLower.includes('mao de obra') || descLower.includes('roçada')) {
                category = 'Mão de Obra';
              } else if (descLower.includes('trator') || descLower.includes('combustível') || descLower.includes('peça') || descLower.includes('manutenção') || descLower.includes('oleo') || descLower.includes('maq')) {
                category = 'Manutenção de Maquinário';
              } else if (descLower.includes('imposto') || descLower.includes('taxa') || descLower.includes('contador') || descLower.includes('energia') || descLower.includes('luz')) {
                category = 'Impostos e Taxas';
              }

              const exists = await this.expenseRepo.findOne({
                where: {
                  date: parsedDate,
                  description: rawDesc,
                  farm: { id: farmId }
                }
              });

              if (!exists) {
                const exp = this.expenseRepo.create({
                  description: rawDesc,
                  date: parsedDate,
                  amount: parsedVal,
                  category: category,
                  payer_name: rawPayer,
                  partner: targetPartner,
                  farm: farm,
                  harvest: targetHarvest,
                  status: 'Pago'
                });
                await this.expenseRepo.save(exp);
                expensesImported++;
              }
            }
          } catch (err: any) {
            errors.push(`Erro na linha ${index + 2} da aba ${sheetName}: ${err.message}`);
          }
        }
      }
      logs.push(`${expensesImported} despesas importadas com sucesso.`);
    } else {
      errors.push("Nenhuma aba de despesas anuais ('Ano XXXX - Café') encontrada.");
    }

    // 2. Processar Receitas (Aba VENDA CAFÉ)
    const vendasSheetName = sheetNames.find(
      n => n.toLowerCase().includes('venda') || n.toLowerCase().includes('receita')
    );

    if (vendasSheetName) {
      const sheet = workbook.Sheets[vendasSheetName];
      const data: any[] = xlsx.utils.sheet_to_json(sheet);

      for (const [index, row] of data.entries()) {
        try {
          const nameKey = Object.keys(row).find(
            k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('socio') || k.toLowerCase().includes('quem')
          );
          if (!nameKey) continue;

          const rawName = String(row[nameKey]).trim();
          const nameLower = rawName.toLowerCase();
          if (nameLower.includes('totais') || nameLower.includes('total')) continue;
          
          const targetPartner = await this.getOrCreatePartner(rawName, farm);

          // Percorrer anos como colunas na aba de Venda Café
          for (const key of Object.keys(row)) {
            const yearMatch = key.trim().match(/^(\d{4})$/);
            if (!yearMatch) continue;

            const year = parseInt(yearMatch[1], 10);
            const rawVal = row[key];
            if (rawVal === undefined || rawVal === null || rawVal === '') continue;

            const parsedVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[R$\s\.]/g, '').replace(',', '.'));
            if (isNaN(parsedVal) || parsedVal <= 0) continue;

            const targetHarvest = await this.getOrCreateHarvest(year, farm);
            const dateStr = `${year}-08-15`; // Data aproximada de venda de safra
            const parsedDate = new Date(dateStr);

            const exists = await this.revenueRepo.findOne({
              where: {
                date: parsedDate,
                farm: { id: farmId }
              }
            });

            if (!exists) {
              const rev = this.revenueRepo.create({
                date: parsedDate,
                sacks_sold: 0,
                price_per_sack: 0,
                total_value: parsedVal,
                buyer_name: 'Venda Café (Carga Excel)',
                receiver_name: rawName,
                partner: targetPartner,
                farm: farm,
                harvest: targetHarvest
              });
              await this.revenueRepo.save(rev);
              revenuesImported++;
            }
          }
        } catch (err: any) {
          errors.push(`Erro na linha ${index + 2} da aba Venda Café: ${err.message}`);
        }
      }
      logs.push(`${revenuesImported} receitas (Venda Café) importadas com sucesso.`);
    } else {
      errors.push("Aba de 'Venda Café' não encontrada. Certifique-se de que o nome da aba contenha a palavra 'Venda'.");
    }

    this.logger.log(`Importação concluída. Despesas: ${expensesImported}, Receitas: ${revenuesImported}`);

    return {
      success: true,
      message: `Processamento concluído. Importadas: ${expensesImported} despesas e ${revenuesImported} receitas. (Erros: ${errors.length})`,
      summary: {
        expensesImported,
        revenuesImported,
      },
      logs,
      errors
    };
  }

  async clearFarmData(farmId: string) {
    if (!farmId) {
      throw new BadRequestException('farmId é obrigatório para limpeza.');
    }

    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) {
      throw new BadRequestException('Fazenda não encontrada.');
    }

    // Deletar despesas, receitas e safras associadas a esta fazenda
    await this.expenseRepo.delete({ farm: { id: farmId } });
    await this.revenueRepo.delete({ farm: { id: farmId } });
    await this.harvestRepo.delete({ farm: { id: farmId } });

    return {
      success: true,
      message: `Todos os dados de despesas, receitas e safras da fazenda "${farm.name}" foram removidos com sucesso.`
    };
  }
}

