import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn , JoinColumn } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('stock_transactions')
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  farm: Farm;

  @Column()
  product_name: string;

  @Column()
  type: string; // ENTRADA, SAIDA

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unit_price: number;

  @Column({ nullable: true })
  notes: string;

  
  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
@CreateDateColumn()
  created_at: Date;
}
