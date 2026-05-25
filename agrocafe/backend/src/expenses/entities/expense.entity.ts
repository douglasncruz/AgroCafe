import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne , JoinColumn } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Plot } from '../../plots/entities/plot.entity';
import { Harvest } from '../../harvests/entities/harvest.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm)
  farm: Farm;

  @ManyToOne(() => Plot, { nullable: true })
  plot: Plot;

  @ManyToOne(() => Harvest, (harvest) => harvest.expenses)
  harvest: Harvest;

  @ManyToOne(() => Partner, { nullable: true, onDelete: 'SET NULL' })
  partner: Partner;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  category: string;

  @Column({ default: 'Pago' })
  status: string;

  @Column({ nullable: true })
  payer_name: string;

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
