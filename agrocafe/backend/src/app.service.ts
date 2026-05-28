import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

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

      console.log('🧹 Iniciando limpeza forçada de dados de demonstração (Fazendas e Safras)...');
      try {
        // 1. Limpar Fazenda de Demonstração e suas dependências
        const demoFarms = await this.entityManager.query(`SELECT id FROM farms WHERE name = 'Agro Cerrado Café (Demonstração)'`);
        for (const farm of demoFarms) {
          const queries = [
            `DELETE FROM expenses WHERE "farmId" = '${farm.id}' OR "harvestId" IN (SELECT id FROM harvests WHERE "farmId" = '${farm.id}')`,
            `DELETE FROM revenues WHERE "farmId" = '${farm.id}' OR "harvestId" IN (SELECT id FROM harvests WHERE "farmId" = '${farm.id}')`,
            `DELETE FROM harvests WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM plots WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM partners WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM agrochemicals WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM ai_diagnoses WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM notifications WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM stock_items WHERE "farmId" = '${farm.id}'`,
            `DELETE FROM machines WHERE "farmId" = '${farm.id}'`,
          ];

          // Stock transactions need item IDs
          try {
            const stockItems = await this.entityManager.query(`SELECT id FROM stock_items WHERE "farmId" = '${farm.id}'`);
            for (const item of stockItems) {
              await this.entityManager.query(`DELETE FROM stock_transactions WHERE "itemId" = '${item.id}'`).catch(e => console.error(e.message));
            }
          } catch(e) {}
          
          // Maintenances need machine IDs
          try {
            const machines = await this.entityManager.query(`SELECT id FROM machines WHERE "farmId" = '${farm.id}'`);
            for (const machine of machines) {
              await this.entityManager.query(`DELETE FROM maintenances WHERE "machineId" = '${machine.id}'`).catch(e => console.error(e.message));
            }
          } catch(e) {}

          for (const q of queries) {
            try {
              await this.entityManager.query(q);
            } catch (e) {
              console.error(`Erro ao rodar: ${q}`, e.message);
            }
          }

          try {
            await this.entityManager.query(`DELETE FROM farms WHERE id = '${farm.id}'`);
          } catch (e) {
            console.error('Erro ao deletar fazenda:', e.message);
          }
        }
        
        // 2. Limpar Safras órfãs que possam ter restado
        try { await this.entityManager.query(`DELETE FROM expenses WHERE "harvestId" IN (SELECT id FROM harvests WHERE name IN ('Safra 2023/2024', 'Safra 2024/2025'))`); } catch(e){}
        try { await this.entityManager.query(`DELETE FROM revenues WHERE "harvestId" IN (SELECT id FROM harvests WHERE name IN ('Safra 2023/2024', 'Safra 2024/2025'))`); } catch(e){}
        try { await this.entityManager.query(`DELETE FROM harvests WHERE name IN ('Safra 2023/2024', 'Safra 2024/2025')`); } catch(e){}

        
        // 3. Garantir que a Fazenda real e suas safras fiquem no mesmo tenant_id do Douglas Cruz
        const douglas = await this.entityManager.findOne(User, { where: { email: 'douglas.cruz@agrocerradocafe.com.br' } });
        if (douglas && douglas.tenant_id) {
           await this.entityManager.query(`UPDATE farms SET tenant_id = '${douglas.tenant_id}' WHERE name IN ('Família Cruz', 'Fazenda Pai e Filho', 'Pai e Filho')`);
           
           // Buscar o ID da fazenda Pai e Filho
           const paiEFilhoQuery = await this.entityManager.query(`SELECT id FROM farms WHERE name IN ('Fazenda Pai e Filho', 'Pai e Filho')`);
           
           if (paiEFilhoQuery.length > 0) {
             const realFarmId = paiEFilhoQuery[0].id;
             // Atualizar as safras reais para pertencerem à fazenda Pai e Filho, além do tenant_id
             await this.entityManager.query(`UPDATE harvests SET tenant_id = '${douglas.tenant_id}', "farmId" = '${realFarmId}' WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%'`);
             
             // Atualizar as despesas e receitas para pertencerem à mesma fazenda
             await this.entityManager.query(`UPDATE expenses SET tenant_id = '${douglas.tenant_id}', "farmId" = '${realFarmId}' WHERE "harvestId" IN (SELECT id FROM harvests WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%')`);
             await this.entityManager.query(`UPDATE revenues SET tenant_id = '${douglas.tenant_id}', "farmId" = '${realFarmId}' WHERE "harvestId" IN (SELECT id FROM harvests WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%')`);
           } else {
             await this.entityManager.query(`UPDATE harvests SET tenant_id = '${douglas.tenant_id}' WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%'`);
             await this.entityManager.query(`UPDATE expenses SET tenant_id = '${douglas.tenant_id}' WHERE "harvestId" IN (SELECT id FROM harvests WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%')`);
             await this.entityManager.query(`UPDATE revenues SET tenant_id = '${douglas.tenant_id}' WHERE "harvestId" IN (SELECT id FROM harvests WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%')`);
           }
        }
        console.log('✅ Dados de demonstração limpos e tenant_ids corrigidos com sucesso!');
      } catch (e) {
        console.error('❌ Erro limpando dados demo:', e.message);
      }

    } catch (error) {
      console.error('❌ Erro na inicialização automática de usuários:', error.message);
    }
  }
}
