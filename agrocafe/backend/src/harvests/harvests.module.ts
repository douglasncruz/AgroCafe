import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HarvestsService } from './harvests.service';
import { HarvestsController } from './harvests.controller';
import { HarvestValidationService } from './harvest-validation.service';
import { Harvest } from './entities/harvest.entity';
import { Farm } from '../farms/entities/farm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Harvest, Farm])],
  controllers: [HarvestsController],
  providers: [HarvestsService, HarvestValidationService],
  exports: [HarvestsService, HarvestValidationService, TypeOrmModule],
})
export class HarvestsModule {}
