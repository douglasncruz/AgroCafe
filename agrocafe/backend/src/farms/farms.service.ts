import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { User } from '../users/entities/user.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Plot } from '../plots/entities/plot.entity';
import { Partner } from '../partners/entities/partner.entity';
import { Agrochemical } from '../agrochemicals/entities/agrochemical.entity';
import { Harvest } from '../harvests/entities/harvest.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Maintenance } from '../machines/entities/maintenance.entity';
import { Diagnosis } from '../ai/entities/diagnosis.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { StockItem } from '../stock/entities/stock-item.entity';
import { StockTransaction } from '../stock/entities/stock-transaction.entity';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource
  ) {}

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  async findAll() {
    return this.farmRepo.find({ 
      where: { tenant_id: this.getTenantId() },
      order: { name: 'ASC' } 
    });
  }

  async create(createFarmDto: any, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const farm = this.farmRepo.create({
      name: createFarmDto.name,
      total_area_hectares: createFarmDto.total_area_hectares,
      city: createFarmDto.city,
      state: createFarmDto.state,
      user: user || undefined,
      // tenant_id is automatically added by TenantSubscriber
    });
    return this.farmRepo.save(farm);
  }

  async remove(id: string, userId: string) {
    const farm = await this.farmRepo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if (!farm) throw new NotFoundException('Fazenda não encontrada');
    
    await this.dataSource.transaction(async (manager) => {
      // 1. Limpar dependências profundas (manutenções de máquinas)
      const machines = await manager.find(Machine, { where: { farm: { id }, tenant_id: this.getTenantId() } });
      for(const m of machines) {
         await manager.delete(Maintenance, { machine: { id: m.id }, tenant_id: this.getTenantId() });
      }
      
      // 2. Limpar dependências diretas da fazenda e orfãos atrelados às safras
      // StockItems can have transactions, so we delete transactions first
      const stockItems = await manager.find(StockItem, { where: { farm: { id }, tenant_id: this.getTenantId() } });
      for (const item of stockItems) {
         await manager.delete(StockTransaction, { item: { id: item.id }, tenant_id: this.getTenantId() });
      }
      await manager.delete(StockItem, { farm: { id }, tenant_id: this.getTenantId() });

      const harvests = await manager.find(Harvest, { where: { farm: { id }, tenant_id: this.getTenantId() } });
      for (const h of harvests) {
         await manager.delete(Expense, { harvest: { id: h.id }, tenant_id: this.getTenantId() });
         await manager.delete(Revenue, { harvest: { id: h.id }, tenant_id: this.getTenantId() });
      }

      await manager.delete(Expense, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Revenue, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Plot, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Partner, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Agrochemical, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Machine, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Harvest, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Diagnosis, { farm: { id }, tenant_id: this.getTenantId() });
      await manager.delete(Notification, { farm: { id }, tenant_id: this.getTenantId() });
      
      // 3. Apagar a fazenda
      await manager.delete(Farm, { id, tenant_id: this.getTenantId() });
    });

    return { success: true, message: 'Fazenda e todos os seus dados foram apagados.' };
  }

  async update(id: string, updateFarmDto: any, userId: string) {
    const farm = await this.farmRepo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if (!farm) throw new NotFoundException('Fazenda não encontrada');
    
    Object.assign(farm, {
      name: updateFarmDto.name,
      total_area_hectares: updateFarmDto.total_area_hectares,
      city: updateFarmDto.city,
      state: updateFarmDto.state,
    });
    
    return this.farmRepo.save(farm);
  }
}
