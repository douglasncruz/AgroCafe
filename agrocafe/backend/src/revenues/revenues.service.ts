import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revenue } from './entities/revenue.entity';
import { Farm } from '../farms/entities/farm.entity';

@Injectable()
export class RevenuesService {
  constructor(
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>
  ) {}

  async findAll() {
    return this.revenueRepo.find({ relations: ['farm'], order: { date: 'DESC' } });
  }

  async create(createDto: any) {
    const farm = await this.farmRepo.findOne({ where: { id: createDto.farmId } });
    
    // Server-side calculation to ensure data integrity
    const sacks = Number(createDto.sacks_sold);
    const price = Number(createDto.price_per_sack);
    const total = sacks * price;

    const revenue = this.revenueRepo.create({
      date: createDto.date,
      sacks_sold: sacks,
      price_per_sack: price,
      total_value: total,
      buyer_name: createDto.buyer_name,
      receiver_name: createDto.receiver_name,
      receipt_url: createDto.receipt_url,
      farm: farm || undefined,
    });
    return this.revenueRepo.save(revenue);
  }

  async remove(id: string) {
    const revenue = await this.revenueRepo.findOne({ where: { id } });
    if (revenue) {
      await this.revenueRepo.remove(revenue);
    }
    return { success: true };
  }
}
