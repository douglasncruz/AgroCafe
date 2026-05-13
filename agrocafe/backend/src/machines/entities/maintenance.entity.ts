import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Machine } from './machine.entity';

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
