import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityLog } from './entities/security-log.entity';
import { SecurityLogsService } from './security-logs.service';
import { SecurityLogsController } from './security-logs.controller';
import { AuditSubscriber } from './subscribers/audit.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([SecurityLog])],
  controllers: [SecurityLogsController],
  providers: [SecurityLogsService, AuditSubscriber],
  exports: [SecurityLogsService],
})
export class SecurityLogsModule {}
