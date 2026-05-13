import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Farm } from '../farms/entities/farm.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine) private machineRepo: Repository<Machine>,
    @InjectRepository(Maintenance) private maintRepo: Repository<Maintenance>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>
  ) {}

  // --- MACHINES ---
  async findAllMachines() {
    return this.machineRepo.find({ relations: ['farm'], order: { created_at: 'DESC' } });
  }

  async createMachine(dto: any) {
    const farm = await this.farmRepo.findOne({ where: { id: dto.farmId } });
    const machine = this.machineRepo.create({
      ...dto,
      farm: farm || undefined
    });
    return this.machineRepo.save(machine);
  }

  async removeMachine(id: string) {
    const machine = await this.machineRepo.findOne({ where: { id } });
    if (machine) {
      // Manually delete related maintenances to avoid SQLite cascade issues
      await this.maintRepo.delete({ machine: { id } });
      await this.machineRepo.remove(machine);
    }
    return { success: true };
  }

  // --- MAINTENANCES ---
  async findAllMaintenances() {
    return this.maintRepo.find({ relations: ['machine'], order: { date: 'DESC' } });
  }

  async createMaintenance(dto: any) {
    const machine = await this.machineRepo.findOne({ where: { id: dto.machineId } });
    const maint = this.maintRepo.create({
      ...dto,
      machine: machine || undefined
    });
    return this.maintRepo.save(maint);
  }

  async removeMaintenance(id: string) {
    const maint = await this.maintRepo.findOne({ where: { id } });
    if (maint) {
      await this.maintRepo.remove(maint);
    }
    return { success: true };
  }
}
