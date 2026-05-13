import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgrochemicalsService } from './agrochemicals.service';
import { AgrochemicalsController } from './agrochemicals.controller';
import { Agrochemical } from './entities/agrochemical.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agrochemical])],
  controllers: [AgrochemicalsController],
  providers: [AgrochemicalsService],
})
export class AgrochemicalsModule {}
