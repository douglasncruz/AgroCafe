import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource
  ) {}

  async findAll() {
    return this.farmRepo.find({ order: { name: 'ASC' } });
  }

  async create(createFarmDto: any, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const farm = this.farmRepo.create({
      name: createFarmDto.name,
      total_area_hectares: createFarmDto.total_area_hectares,
      city: createFarmDto.city,
      state: createFarmDto.state,
      user: user || undefined,
    });
    return this.farmRepo.save(farm);
  }

  async remove(id: string, userId: string) {
    const farm = await this.farmRepo.findOne({ where: { id } });
    if (!farm) throw new NotFoundException('Fazenda não encontrada');
    
    await this.dataSource.transaction(async (manager) => {
      // 1. Limpar dependências profundas (manutenções de máquinas)
      const machines = await manager.find(Machine, { where: { farm: { id } } });
      for(const m of machines) {
         await manager.delete(Maintenance, { machine: { id: m.id } });
      }
      
      // 2. Limpar dependências diretas da fazenda
      await manager.delete(Expense, { farm: { id } });
      await manager.delete(Revenue, { farm: { id } });
      await manager.delete(Plot, { farm: { id } });
      await manager.delete(Partner, { farm: { id } });
      await manager.delete(Agrochemical, { farm: { id } });
      await manager.delete(Machine, { farm: { id } });
      await manager.delete(Harvest, { farm: { id } });
      
      // 3. Apagar a fazenda
      await manager.delete(Farm, id);
    });

    return { success: true, message: 'Fazenda e todos os seus dados foram apagados.' };
  }

  async update(id: string, updateFarmDto: any, userId: string) {
    const farm = await this.farmRepo.findOne({ where: { id } });
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
