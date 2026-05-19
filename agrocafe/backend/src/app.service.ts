import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager
  ) {}

  getHello(): string {
    return 'AgroCerradoCafé API is running!';
  }

  async onModuleInit() {
    console.log('🚀 Inicializando sistema e verificando usuários padrão...');
    
    // DEBUG EXCEL STRUCTURE
    try {
      const excelPath = path.join(process.cwd(), 'Despesas-Cafe.xlsx');
      const scratchDir = path.join(process.cwd(), '..', 'scratch');
      const outputPath = path.join(scratchDir, 'excel_structure.txt');
      
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir, { recursive: true });
      }

      if (fs.existsSync(excelPath)) {
        const workbook = xlsx.readFile(excelPath);
        const info = {
          sheets: workbook.SheetNames,
          sheetContents: {} as any
        };
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
          info.sheetContents[sheetName] = {
            rowCount: rows.length,
            sampleRows: rows.slice(0, 5)
          };
        });
        
        fs.writeFileSync(outputPath, JSON.stringify(info, null, 2), 'utf-8');
        console.log('✅ Estrutura do Excel salva em scratch/excel_structure.txt');
      } else {
        console.log('❌ Arquivo Despesas-Cafe.xlsx nao encontrado em:', excelPath);
      }
    } catch (e: any) {
      console.error('❌ Erro ao depurar Excel:', e.message);
    }
    try {
      const defaultUsers = [
        { name: 'Administrador Agro', email: 'admin@agrocerradocafe.com.br', password: 'admin' },
        { name: 'José Cruz', email: 'jose.cruz@agrocerradocafe.com.br', password: 'Mjd2725' },
        { name: 'Zipora Cruz', email: 'zipora.cruz@agrocerradocafe.com.br', password: 'Agro@2026' },
        { name: 'Douglas Cruz', email: 'douglas.cruz@agrocerradocafe.com.br', password: 'Druida@011322' }
      ];

      // Remover usuário com grafia incorreta se existir
      await this.entityManager.delete(User, { email: 'duglas.cruz@agrocerradocafe.com.br' });

      for (const u of defaultUsers) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const existingUser = await this.entityManager.findOne(User, { where: { email: u.email } });
        
        if (!existingUser) {
          const newUser = this.entityManager.create(User, {
            name: u.name,
            email: u.email,
            password_hash: hashedPassword,
          });
          await this.entityManager.save(newUser);
          console.log(`[BOOTSTRAP] ✅ Criado novo usuário: ${u.email}`);
        } else {
          // Atualizar senha e nome para garantir que as credenciais solicitadas funcionem
          await this.entityManager.update(User, { id: existingUser.id }, { 
            password_hash: hashedPassword,
            name: u.name 
          });
          console.log(`[BOOTSTRAP] 🔄 Credenciais sincronizadas para: ${u.email}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro na inicialização automática de usuários:', error.message);
    }
  }
}
