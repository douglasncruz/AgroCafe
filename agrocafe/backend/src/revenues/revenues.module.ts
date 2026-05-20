import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenuesService } from './revenues.service';
import { RevenuesController } from './revenues.controller';
import { Revenue } from './entities/revenue.entity';
import { Farm } from '../farms/entities/farm.entity';
import { HarvestsModule } from '../harvests/harvests.module';

import { Partner } from '../partners/entities/partner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Revenue, Farm, Partner]),
    HarvestsModule,
  ],
  controllers: [RevenuesController],
  providers: [RevenuesService],
})
export class RevenuesModule {}
