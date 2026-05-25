import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantSubscriber } from './subscribers/tenant.subscriber';
import { TenantMigrationService } from './tenant-migration.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User])],
  providers: [TenantsService, TenantSubscriber, TenantMigrationService],
  exports: [TenantsService],
})
export class TenantsModule {}
