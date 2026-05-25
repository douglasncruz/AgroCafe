import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn , ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';


@Entity('security_logs')
export class SecurityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  user_name: string | null;

  @Column()
  action: string;

  @Column()
  module_name: string;

  @Column({ type: 'varchar', nullable: true })
  record_id: string | null;

  @Column({ type: 'json', nullable: true })
  old_values: any | null;

  @Column({ type: 'json', nullable: true })
  new_values: any | null;

  @Column({ type: 'varchar', nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', nullable: true })
  user_agent: string | null;

  @Column()
  status: string; // SUCCESS, WARNING, FAILURE

  
  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
@CreateDateColumn()
  created_at: Date;
}
