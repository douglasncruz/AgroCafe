import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Revenue } from '../../revenues/entities/revenue.entity';

export enum HarvestStatus {
  ABERTA = 'Aberta',
  ENCERRADA = 'Encerrada',
  ARQUIVADA = 'Arquivada',
}

@Entity('harvests')
export class Harvest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // ex: "Safra 2024" ou "Safra 2024/25"

  @Column({ type: 'int', nullable: true })
  year: number; // Ano principal da safra (ex: 2024)

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Index()
  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 20, default: HarvestStatus.ABERTA })
  status: HarvestStatus; // 'Aberta' | 'Encerrada' | 'Arquivada'

  @Column({ type: 'text', nullable: true })
  notes: string; // Observações livres

  @ManyToOne(() => Farm, (farm) => farm.harvests, { onDelete: 'CASCADE' })
  farm: Farm;

  @OneToMany(() => Expense, (expense) => expense.harvest)
  expenses: Expense[];

  @OneToMany(() => Revenue, (revenue) => revenue.harvest)
  revenues: Revenue[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
