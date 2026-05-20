import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Plot } from '../../plots/entities/plot.entity';
import { Harvest } from '../../harvests/entities/harvest.entity';
import { Partner } from '../../partners/entities/partner.entity';

@Entity('revenues')
export class Revenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm)
  farm: Farm;

  @ManyToOne(() => Plot, { nullable: true })
  plot: Plot;

  @ManyToOne(() => Harvest, (harvest) => harvest.revenues)
  harvest: Harvest;

  @ManyToOne(() => Partner, { nullable: true, onDelete: 'SET NULL' })
  partner: Partner;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sacks_sold: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price_per_sack: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_value: number;

  @Column({ nullable: true })
  buyer_name: string;

  @Column({ nullable: true })
  receiver_name: string;

  @Column({ nullable: true })
  receipt_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
