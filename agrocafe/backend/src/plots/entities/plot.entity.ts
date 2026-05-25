import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne , JoinColumn } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm)
  farm: Farm;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area_hectares: number;

  @Column()
  coffee_variety: string;

  @Column()
  planting_year: number;

  @Column({ default: 'Ativo' })
  status: string;

  
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
