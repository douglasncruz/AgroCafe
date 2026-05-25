import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>
  ) {}

  async createTenant(name: string, environmentType: 'real' | 'demo' = 'real', isDemoAccount: boolean = false): Promise<Tenant> {
    const tenant = this.tenantRepo.create({
      name,
      environment_type: environmentType,
      is_demo_account: isDemoAccount
    });
    return this.tenantRepo.save(tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepo.findOne({ where: { id } });
  }
}
