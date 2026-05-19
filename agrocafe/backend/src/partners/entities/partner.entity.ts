import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  farm: Farm;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  share_percentage: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  contact_info: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
