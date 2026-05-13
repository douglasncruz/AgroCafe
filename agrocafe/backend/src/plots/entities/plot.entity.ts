import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm)
  farm: Farm;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area_hectares: number;

  @Column()
  coffee_variety: string;

  @Column()
  planting_year: number;

  @Column({ default: 'Ativo' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
