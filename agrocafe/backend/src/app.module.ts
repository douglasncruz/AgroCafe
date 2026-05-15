import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FarmsModule } from './farms/farms.module';
import { RevenuesModule } from './revenues/revenues.module';
import { MachinesModule } from './machines/machines.module';
import { PartnersModule } from './partners/partners.module';
import { ReportsModule } from './reports/reports.module';
import { AgrochemicalsModule } from './agrochemicals/agrochemicals.module';
import { AuditModule } from './audit/audit.module';
import { HarvestsModule } from './harvests/harvests.module';
import { User } from './users/entities/user.entity';
import { Farm } from './farms/entities/farm.entity';
import { Plot } from './plots/entities/plot.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Revenue } from './revenues/entities/revenue.entity';
import { Machine } from './machines/entities/machine.entity';
import { Maintenance } from './machines/entities/maintenance.entity';
import { Partner } from './partners/entities/partner.entity';
import { Agrochemical } from './agrochemicals/entities/agrochemical.entity';
import { Harvest } from './harvests/entities/harvest.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Farm, Plot, Expense, Revenue, Machine, Maintenance, Partner, Agrochemical, Harvest],
            synchronize: true, // Habilitado para criar as tabelas no Supabase durante a instalação
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          type: 'sqlite',
          database: 'agrocafe.sqlite',
          entities: [User, Farm, Plot, Expense, Revenue, Machine, Maintenance, Partner, Agrochemical],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    DashboardModule,
    ExpensesModule,
    FarmsModule,
    RevenuesModule,
    MachinesModule,
    PartnersModule,
    ReportsModule,
    AgrochemicalsModule,
    AuditModule,
    HarvestsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
