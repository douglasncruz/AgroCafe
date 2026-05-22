import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DemoService } from './demo.service';

@Injectable()
export class DemoSchedule {
  private readonly logger = new Logger(DemoSchedule.name);

  constructor(private readonly demoService: DemoService) {}

  // Roda todo dia à meia noite (00:00)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDemoResetCron() {
    this.logger.log('Iniciando rotina diária de Reset do Ambiente de Demonstração');
    await this.demoService.resetDemoEnvironment();
  }
}
