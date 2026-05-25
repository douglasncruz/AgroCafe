import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantMigrationService implements OnModuleInit {
  private readonly logger = new Logger(TenantMigrationService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async onModuleInit() {
    this.logger.log('Verificando necessidade de migração de Tenants...');
    
    // Pegar usuários que não têm tenant_id
    const usersWithoutTenant = await this.userRepo.find({
      where: { tenant_id: null as any },
    });

    if (usersWithoutTenant.length === 0) {
      this.logger.log('Nenhum usuário pendente de migração para Tenant.');
      return;
    }

    this.logger.log(`Encontrados ${usersWithoutTenant.length} usuários sem Tenant. Iniciando migração...`);

    for (const user of usersWithoutTenant) {
      try {
        // Criar tenant
        const envType = user.is_demo ? 'demo' : 'real';
        const tenantName = user.is_demo ? 'Ambiente de Demonstração' : `Organização de ${user.name}`;
        
        const newTenant = this.tenantRepo.create({
          name: tenantName,
          environment_type: envType,
          is_demo_account: user.is_demo
        });
        
        const savedTenant = await this.tenantRepo.save(newTenant);

        // Atualizar usuário
        user.tenant_id = savedTenant.id;
        await this.userRepo.save(user);

        // Atualizar todas as tabelas relacionadas usando SQL direto para evitar disparar subscribers/hooks
        // O farm pertence ao usuário, então atualizamos os farms primeiro
        await this.userRepo.query(`
          UPDATE farms SET tenant_id = $1 WHERE "userId" = $2 AND tenant_id IS NULL
        `, [savedTenant.id, user.id]);

        // Para as outras tabelas, atualizamos baseados nos farms que agora têm o tenant_id
        const queries = [
          `UPDATE harvests SET tenant_id = $1 FROM farms WHERE harvests."farmId" = farms.id AND farms."userId" = $2 AND harvests.tenant_id IS NULL`,
          `UPDATE expenses SET tenant_id = $1 FROM farms WHERE expenses."farmId" = farms.id AND farms."userId" = $2 AND expenses.tenant_id IS NULL`,
          `UPDATE revenues SET tenant_id = $1 FROM farms WHERE revenues."farmId" = farms.id AND farms."userId" = $2 AND revenues.tenant_id IS NULL`,
          `UPDATE machines SET tenant_id = $1 FROM farms WHERE machines."farmId" = farms.id AND farms."userId" = $2 AND machines.tenant_id IS NULL`,
          `UPDATE maintenances SET tenant_id = $1 FROM machines INNER JOIN farms ON machines."farmId" = farms.id WHERE maintenances."machineId" = machines.id AND farms."userId" = $2 AND maintenances.tenant_id IS NULL`,
          `UPDATE partners SET tenant_id = $1 FROM farms WHERE partners."farmId" = farms.id AND farms."userId" = $2 AND partners.tenant_id IS NULL`,
          `UPDATE agrochemicals SET tenant_id = $1 FROM farms WHERE agrochemicals."farmId" = farms.id AND farms."userId" = $2 AND agrochemicals.tenant_id IS NULL`,
          `UPDATE stock_items SET tenant_id = $1 FROM farms WHERE stock_items."farmId" = farms.id AND farms."userId" = $2 AND stock_items.tenant_id IS NULL`,
          `UPDATE stock_transactions SET tenant_id = $1 FROM farms WHERE stock_transactions."farmId" = farms.id AND farms."userId" = $2 AND stock_transactions.tenant_id IS NULL`,
          `UPDATE ai_diagnoses SET tenant_id = $1 FROM farms WHERE ai_diagnoses."farmId" = farms.id AND farms."userId" = $2 AND ai_diagnoses.tenant_id IS NULL`,
          `UPDATE notifications SET tenant_id = $1 FROM farms WHERE notifications."farmId" = farms.id AND farms."userId" = $2 AND notifications.tenant_id IS NULL`,
        ];

        for (const query of queries) {
          try {
            await this.userRepo.query(query, [savedTenant.id, user.id]);
          } catch (e) {
             // Pode falhar no sqlite (suporta sintaxe diferente do postgres para UPDATE FROM).
             // Fallback para SQLite
             const tableNameMatch = query.match(/UPDATE (\w+) /);
             if (tableNameMatch) {
                const tableName = tableNameMatch[1];
                let sqliteQuery = "";
                if (tableName === 'maintenances') {
                   sqliteQuery = `UPDATE maintenances SET tenant_id = '${savedTenant.id}' WHERE machineId IN (SELECT id FROM machines WHERE farmId IN (SELECT id FROM farms WHERE userId = '${user.id}')) AND tenant_id IS NULL`;
                } else {
                   sqliteQuery = `UPDATE ${tableName} SET tenant_id = '${savedTenant.id}' WHERE farmId IN (SELECT id FROM farms WHERE userId = '${user.id}') AND tenant_id IS NULL`;
                }
                try {
                  await this.userRepo.query(sqliteQuery);
                } catch(sqliteErr) {
                  this.logger.error(`Erro no Fallback SQLite para ${tableName}`, sqliteErr);
                }
             }
          }
        }

        this.logger.log(`Migração concluída para o usuário ${user.email} -> Tenant: ${savedTenant.id}`);
      } catch (error) {
        this.logger.error(`Erro ao migrar usuário ${user.email}`, error);
      }
    }
    
    this.logger.log('Processo de migração de Tenants finalizado.');
  }
}
