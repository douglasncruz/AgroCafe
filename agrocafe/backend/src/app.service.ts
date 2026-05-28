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
          await this.entityManager.query(`DELETE FROM expenses WHERE "farmId" = '${farm.id}'`);
          await this.entityManager.query(`DELETE FROM revenues WHERE "farmId" = '${farm.id}'`);
          await this.entityManager.query(`DELETE FROM harvests WHERE "farmId" = '${farm.id}'`);
          await this.entityManager.query(`DELETE FROM farms WHERE id = '${farm.id}'`);
        }
        
        // 2. Limpar Safras órfãs que possam ter restado
        await this.entityManager.query(`DELETE FROM expenses WHERE "harvestId" IN (SELECT id FROM harvests WHERE name IN ('Safra 2023/2024', 'Safra 2024/2025'))`);
        await this.entityManager.query(`DELETE FROM revenues WHERE "harvestId" IN (SELECT id FROM harvests WHERE name IN ('Safra 2023/2024', 'Safra 2024/2025'))`);
        await this.entityManager.query(`DELETE FROM harvests WHERE name IN ('Safra 2023/2024', 'Safra 2024/2025')`);
        
        // 3. Garantir que a Fazenda real e suas safras fiquem no mesmo tenant_id do Douglas Cruz
        const douglas = await this.entityManager.findOne(User, { where: { email: 'douglas.cruz@agrocerradocafe.com.br' } });
        if (douglas && douglas.tenant_id) {
           await this.entityManager.query(`UPDATE farms SET tenant_id = '${douglas.tenant_id}' WHERE name IN ('Família Cruz', 'Fazenda Pai e Filho')`);
           await this.entityManager.query(`UPDATE harvests SET tenant_id = '${douglas.tenant_id}' WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%'`);
           await this.entityManager.query(`UPDATE expenses SET tenant_id = '${douglas.tenant_id}' WHERE "harvestId" IN (SELECT id FROM harvests WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%')`);
           await this.entityManager.query(`UPDATE revenues SET tenant_id = '${douglas.tenant_id}' WHERE "harvestId" IN (SELECT id FROM harvests WHERE name LIKE 'Safra 202%' AND name NOT LIKE '%/%')`);
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
