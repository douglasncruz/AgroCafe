import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { DemoService } from './demo.service';
import { DemoSchedule } from './demo.schedule';
import { Farm } from '../farms/entities/farm.entity';
import { Harvest } from '../harvests/entities/harvest.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Farm, Harvest, Expense, Revenue, Tenant])],
  providers: [UsersService, DemoService, DemoSchedule],
  controllers: [UsersController],
  exports: [UsersService, DemoService],
})
export class UsersModule {}
