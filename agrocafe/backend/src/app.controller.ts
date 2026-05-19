import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as xlsx from 'xlsx';
import * as path from 'path';
import { Farm } from './farms/entities/farm.entity';
import { Expense } from './expenses/entities/expense.entity';
import { User } from './users/entities/user.entity';
import { Harvest, HarvestStatus } from './harvests/entities/harvest.entity';
import * as bcrypt from 'bcrypt';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectEntityManager() private readonly entityManager: EntityManager
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('inspect-excel')
  async inspectExcel() {
    try {
      const fs = require('fs');
      const filePaths = [
        path.join(process.cwd(), 'Despesas-Cafe.xlsx'),
        path.join(process.cwd(), '..', 'Despesas-Cafe.xlsx')
      ];
      
      let filePath = '';
      for (const p of filePaths) {
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      }
      
      if (!filePath) {
        return { error: 'Planilha não encontrada', searchedPaths: filePaths };
      }
      
      const workbook = xlsx.readFile(filePath);
      const result: any = {};
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        result[sheetName] = {
          rowCount: data.length,
          firstRows: data.slice(0, 8)
        };
      }
      
      return { filePath, sheets: result };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  @Get('import/seed-excel')
  async seedExcel() {
    try {
      const filePath = path.join(process.cwd(), 'Despesas-Cafe.xlsx');
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

      // Create default users if they don't exist
      const defaultUsers = [
        { name: 'Administrador Agro', email: 'admin@agrocerradocafe.com.br', password: 'admin' },
        { name: 'José Cruz', email: 'jose.cruz@agrocerradocafe.com.br', password: 'Mjd2725' },
        { name: 'Zipora Cruz', email: 'zipora.cruz@agrocerradocafe.com.br', password: 'Agro@2026' },
        { name: 'Douglas Cruz', email: 'douglas.cruz@agrocerradocafe.com.br', password: 'Druida@011322' }
      ];

      for (const u of defaultUsers) {
        let existingUser = await this.entityManager.findOne(User, { where: { email: u.email } });
        if (!existingUser) {
          existingUser = this.entityManager.create(User, {
            name: u.name,
            email: u.email,
            password_hash: await bcrypt.hash(u.password, 10),
          });
          await this.entityManager.save(existingUser);
        }
      }

      const user = await this.entityManager.findOne(User, { where: { email: 'admin@agrocerradocafe.com.br' } });

      const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (!row || !row[0] || row[0] === 'Totais') continue;

        const farmName = row[0]; // e.g. "Douglas" or "Cruz"
        
        // Find or create Farm
        let farm = await this.entityManager.findOne(Farm, { where: { name: farmName } });
        if (!farm) {
          farm = this.entityManager.create(Farm, {
            name: farmName,
            total_area_hectares: 50,
            user: user || undefined
          });
          farm = await this.entityManager.save(farm);
        }

        // Generate expenses per year distributed across 12 months
        for (let j = 0; j < years.length; j++) {
          const year = years[j];
          const colIndex = j + 1; // Col 1 is 2020, Col 2 is 2021...
          const totalYearlyExpense = row[colIndex];
          
          if (totalYearlyExpense && !isNaN(totalYearlyExpense)) {
            const monthlyAmount = totalYearlyExpense / 12;

            // Find or create Harvest for this year/farm
            let harvest = await this.entityManager.findOne(Harvest, { 
              where: { name: `Safra ${year}`, farm: { id: farm.id } } 
            });
            
            if (!harvest) {
              harvest = this.entityManager.create(Harvest, {
                name: `Safra ${year}`,
                farm: farm,
                is_active: year === 2026,
                status: year < 2026 ? HarvestStatus.ENCERRADA : HarvestStatus.ABERTA
              });
              harvest = await this.entityManager.save(harvest);
            }
            
            for (let month = 0; month < 12; month++) {
              const expense = this.entityManager.create(Expense, {
                farm: farm,
                harvest: harvest,
                description: `Custeio geral - ${farmName} (${year})`,
                amount: monthlyAmount,
                date: new Date(year, month, 15),
                category: 'Geral',
                status: 'Pago'
              });
              await this.entityManager.save(expense);
            }
          }
        }
      }

      return { message: 'Dados importados com sucesso a partir da planilha Despesas-Café.xlsx!' };
    } catch (err: any) {
      return { error: 'Erro ao importar', details: err.message };
    }
  }
}
