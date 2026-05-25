import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne , JoinColumn } from 'typeorm';
import { Machine } from './machine.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('maintenances')
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Machine, { onDelete: 'CASCADE' })
  machine: Machine;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column()
  type: string; // Preventiva, Corretiva

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cost: number;

  @Column({ nullable: true })
  provider_name: string; // Mecânico / Oficina

  @Column({ nullable: true })
  receipt_url: string;

  
  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
@CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
