import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { User } from '../../users/entities/user.entity';

@Entity('diagnoses')
export class Diagnosis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  image_base64: string;

  @Column({ length: 150 })
  disease_name: string;

  @Column({ length: 20 })
  severity: string;

  @Column({ type: 'json' })
  analysis_result: any;

  @CreateDateColumn()
  created_at: Date;
}
