import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { Machine } from './entities/machine.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Farm } from '../farms/entities/farm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Machine, Maintenance, Farm])],
  controllers: [MachinesController],
  providers: [MachinesService],
})
export class MachinesModule {}
