import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';


export enum NotificationType {
  FINANCEIRO = 'FINANCEIRO',
  SAFRA = 'SAFRA',
  ESTOQUE = 'ESTOQUE',
  MAQUINAS = 'MAQUINAS',
  SEGURANCA = 'SEGURANCA',
  IA = 'IA',
  SISTEMA = 'SISTEMA'
}

export enum NotificationPriority {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  SUCCESS = 'SUCCESS'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50, default: NotificationType.SISTEMA })
  type: string; // Financeiro, Safra, etc.

  @Column({ type: 'varchar', length: 20, default: NotificationPriority.INFO })
  priority: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  action_link: string;

  @Column({ default: false })
  is_read: boolean;

  
  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
@CreateDateColumn()
  created_at: Date;
}
