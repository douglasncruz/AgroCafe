import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne , JoinColumn } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm)
  farm: Farm;

  @Column()
  name: string; // Ex: Trator John Deere 5075E

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column()
  type: string; // Trator, Colheitadeira, Implemento, Veículo

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  acquisition_value: number;

  @Column({ nullable: true })
  plate_or_chassis: string;

  @Column({ default: 'Ativo' })
  status: string; // Ativo, Em Manutenção, Vendido

  
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
