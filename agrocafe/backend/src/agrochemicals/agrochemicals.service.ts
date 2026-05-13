import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agrochemical } from './entities/agrochemical.entity';

@Injectable()
export class AgrochemicalsService {
  constructor(
    @InjectRepository(Agrochemical) private repo: Repository<Agrochemical>,
  ) {}

  async findAll(farmId: string) {
    return this.repo.find({ 
      where: { farm: { id: farmId } },
      order: { application_date: 'DESC' }
    });
  }

  async create(dto: any) {
    const appDate = new Date(dto.application_date);
    const safeDate = new Date(appDate);
    safeDate.setDate(safeDate.getDate() + Number(dto.grace_period_days));

    const record = this.repo.create({
      ...dto,
      recipe_url: dto.recipe_url,
      safe_harvest_date: safeDate,
      farm: { id: dto.farmId } as any
    });
    return this.repo.save(record);
  }

  async remove(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if(record) {
      await this.repo.remove(record);
    }
    return { success: true };
  }
}
