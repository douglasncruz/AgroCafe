import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { Partner } from './entities/partner.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Partner, Expense, Revenue])],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
