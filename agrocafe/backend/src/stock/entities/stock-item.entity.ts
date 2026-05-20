import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('stock_items')
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  farm: Farm;

  @Column()
  product_name: string;

  @Column()
  category: string; // Defensivo, Fertilizante, Outro

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column()
  unit: string; // L, Kg, Saco, Unidade

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_quantity: number;
}
