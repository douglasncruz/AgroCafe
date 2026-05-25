import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
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
import { DataImportModule } from './data-import/data-import.module';
import { StockModule } from './stock/stock.module';
import { NotificationsModule } from './notifications/notifications.module';
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
import { StockItem } from './stock/entities/stock-item.entity';
import { StockTransaction } from './stock/entities/stock-transaction.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Diagnosis } from './ai/entities/diagnosis.entity';
import { AiModule } from './ai/ai.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ContextMiddleware } from './common/middleware/context.middleware';
import { SecurityLogsModule } from './security-logs/security-logs.module';
import { SecurityLog } from './security-logs/entities/security-log.entity';
import { TenantsModule } from './tenants/tenants.module';
import { Tenant } from './tenants/entities/tenant.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
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
            entities: [User, Farm, Plot, Expense, Revenue, Machine, Maintenance, Partner, Agrochemical, Harvest, StockItem, StockTransaction, Notification, Diagnosis, SecurityLog, Tenant],
            synchronize: true, // Habilitado para criar as tabelas no Supabase durante a instalação
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          type: 'sqlite',
          database: 'agrocafe.sqlite',
          entities: [User, Farm, Plot, Expense, Revenue, Machine, Maintenance, Partner, Agrochemical, Harvest, StockItem, StockTransaction, Notification, Diagnosis, SecurityLog, Tenant],
          synchronize: process.env.NODE_ENV !== 'production',
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
    HarvestsModule,
    DataImportModule,
    StockModule,
    AiModule,
    NotificationsModule,
    SecurityLogsModule,
    TenantsModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes('*');
  }
}

