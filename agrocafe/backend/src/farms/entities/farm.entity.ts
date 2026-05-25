import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany , JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Harvest } from '../../harvests/entities/harvest.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_area_hectares: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @ManyToOne(() => User)
  user: User;

  @OneToMany(() => Harvest, (harvest) => harvest.farm)
  harvests: Harvest[];

  
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
