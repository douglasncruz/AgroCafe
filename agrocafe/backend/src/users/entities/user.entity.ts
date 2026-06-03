import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_demo: boolean;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  role_name: string;

  @Column({ type: 'text', nullable: true })
  avatar_base64: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime', nullable: true })
  last_login: Date;

  @Column({ type: 'json', default: '{}' })
  permissions: any;

  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
