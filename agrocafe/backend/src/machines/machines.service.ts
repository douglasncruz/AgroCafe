import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Farm } from '../farms/entities/farm.entity';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine) private machineRepo: Repository<Machine>,
    @InjectRepository(Maintenance) private maintRepo: Repository<Maintenance>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>
  ) {}

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  // --- MACHINES ---
  async findAllMachines() {
    return this.machineRepo.find({ where: { tenant_id: this.getTenantId() }, relations: ['farm'], order: { created_at: 'DESC' } });
  }

  async createMachine(dto: any) {
    const farm = await this.farmRepo.findOne({ where: { id: dto.farmId, tenant_id: this.getTenantId() } });
    const machine = this.machineRepo.create({
      ...dto,
      farm: farm || undefined
    });
    return this.machineRepo.save(machine);
  }

  async removeMachine(id: string) {
    const machine = await this.machineRepo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if (machine) {
      // Manually delete related maintenances to avoid SQLite cascade issues
      await this.maintRepo.delete({ machine: { id }, tenant_id: this.getTenantId() });
      await this.machineRepo.remove(machine);
    }
    return { success: true };
  }

  // --- MAINTENANCES ---
  async findAllMaintenances() {
    return this.maintRepo.find({ where: { tenant_id: this.getTenantId() }, relations: ['machine'], order: { date: 'DESC' } });
  }

  async createMaintenance(dto: any) {
    const machine = await this.machineRepo.findOne({ where: { id: dto.machineId, tenant_id: this.getTenantId() } });
    const maint = this.maintRepo.create({
      ...dto,
      machine: machine || undefined
    });
    return this.maintRepo.save(maint);
  }

  async removeMaintenance(id: string) {
    const maint = await this.maintRepo.findOne({ where: { id, tenant_id: this.getTenantId() } });
    if (maint) {
      await this.maintRepo.remove(maint);
    }
    return { success: true };
  }
}
