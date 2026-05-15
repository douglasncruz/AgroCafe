import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as xlsx from 'xlsx';
import * as path from 'path';
import { Farm } from './farms/entities/farm.entity';
import { Expense } from './expenses/entities/expense.entity';
import { User } from './users/entities/user.entity';
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

  @Get('import/seed-excel')
  async seedExcel() {
    try {
      const filePath = path.join(process.cwd(), 'Despesas-Cafe.xlsx');
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

      // Create a master user if it doesn't exist
      let user = await this.entityManager.findOne(User, { where: { email: 'admin@agrocafe.com' } });
      if (!user) {
        user = this.entityManager.create(User, {
          name: 'Administrador Agro',
          email: 'admin@agrocafe.com',
          password_hash: await bcrypt.hash('123456', 10),
        });
        await this.entityManager.save(user);
      }

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
            user: user
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
            
            for (let month = 0; month < 12; month++) {
              const expense = this.entityManager.create(Expense, {
                farm: farm,
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
