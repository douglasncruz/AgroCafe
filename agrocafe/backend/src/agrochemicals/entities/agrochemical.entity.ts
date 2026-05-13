import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('agrochemicals')
export class Agrochemical {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  farm: Farm;

  @Column()
  product_name: string; // Ex: RoundUp, Priori Xtra

  @Column()
  target_pest: string; // Praga ou Doença Alvo (Ex: Ferrugem, Broca, Mato)

  @Column({ type: 'date' })
  application_date: Date;

  @Column()
  plot_applied: string; // Talhão

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity_used: number; // Quantidade total (L ou Kg)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dose_per_hectare: number; // Dosagem (L/ha)

  @Column({ type: 'int' })
  grace_period_days: number; // Tempo de carência em dias

  @Column({ type: 'date' })
  safe_harvest_date: Date; // Calculado no backend

  @Column({ nullable: true })
  agronomist_recipe: string; // Número do Receituário Agronômico

  @Column({ nullable: true })
  operator_name: string; // Quem fez a aplicação

  @Column({ nullable: true })
  recipe_url: string; // Link para a foto/PDF da receita agronômica

  @CreateDateColumn()
  created_at: Date;
}
