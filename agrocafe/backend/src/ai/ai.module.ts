import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DashboardModule } from '../dashboard/dashboard.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagnosis } from './entities/diagnosis.entity';

@Module({
  imports: [DashboardModule, TypeOrmModule.forFeature([Diagnosis])],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule {}
