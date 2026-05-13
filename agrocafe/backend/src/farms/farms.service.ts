import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { User } from '../users/entities/user.entity';

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
    
    // SQLite sem CASCADE nativo precisa deletar os filhos manualmente
    try {
      await this.dataSource.query(`DELETE FROM expenses WHERE "farmId" = ?`, [id]);
      await this.dataSource.query(`DELETE FROM revenues WHERE "farmId" = ?`, [id]);
      await this.dataSource.query(`DELETE FROM plots WHERE "farmId" = ?`, [id]);
      await this.dataSource.query(`DELETE FROM partners WHERE "farmId" = ?`, [id]);
      await this.dataSource.query(`DELETE FROM agrochemicals WHERE "farmId" = ?`, [id]);
      
      const machines = await this.dataSource.query(`SELECT id FROM machines WHERE "farmId" = ?`, [id]);
      for(const m of machines) {
         await this.dataSource.query(`DELETE FROM maintenances WHERE "machineId" = ?`, [m.id]);
      }
      await this.dataSource.query(`DELETE FROM machines WHERE "farmId" = ?`, [id]);
    } catch(e) {
      console.log("Ignored missing tables or delete constraints", e);
    }
    
    await this.farmRepo.delete(id);
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
