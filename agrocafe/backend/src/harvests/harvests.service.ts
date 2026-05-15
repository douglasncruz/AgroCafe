import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Harvest } from './entities/harvest.entity';
import { Farm } from '../farms/entities/farm.entity';

@Injectable()
export class HarvestsService {
  constructor(
    @InjectRepository(Harvest)
    private harvestsRepository: Repository<Harvest>,
    @InjectRepository(Farm)
    private farmsRepository: Repository<Farm>,
  ) {}

  async findAllByFarm(farmId: string) {
    return this.harvestsRepository.find({
      where: { farm: { id: farmId } },
      order: { created_at: 'DESC' },
    });
  }

  async findActiveByFarm(farmId: string) {
    return this.harvestsRepository.findOne({
      where: { farm: { id: farmId }, is_active: true },
    });
  }

  async create(farmId: string, name: string) {
    const farm = await this.farmsRepository.findOne({ where: { id: farmId } });
    if (!farm) throw new Error('Farm not found');

    // Se for a primeira safra, marca como ativa
    const count = await this.harvestsRepository.count({ where: { farm: { id: farmId } } });
    
    const harvest = this.harvestsRepository.create({
      name,
      farm,
      is_active: count === 0,
    });

    return this.harvestsRepository.save(harvest);
  }

  async setActive(farmId: string, harvestId: string) {
    // Desativa todas
    await this.harvestsRepository.update({ farm: { id: farmId } }, { is_active: false });
    // Ativa a selecionada
    await this.harvestsRepository.update(harvestId, { is_active: true });
    return { success: true };
  }
}
