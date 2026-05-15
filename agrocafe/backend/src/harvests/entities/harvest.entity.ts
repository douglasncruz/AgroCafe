import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Revenue } from '../../revenues/entities/revenue.entity';

@Entity('harvests')
export class Harvest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // ex: "Safra 2024" ou "Safra 2024/25"

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 'Aberta' })
  status: string; // 'Aberta' | 'Fechada'

  @ManyToOne(() => Farm, (farm) => farm.harvests)
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
