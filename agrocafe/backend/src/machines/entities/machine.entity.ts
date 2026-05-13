import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
