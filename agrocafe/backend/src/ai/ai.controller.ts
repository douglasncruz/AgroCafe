import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from '../dashboard/dashboard.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly dashboardService: DashboardService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Request() req: any, @Body('message') message: string) {
    // Busca dados de contexto limitados do Dashboard
    // Num cenário avançado, passaríamos as datas do mês atual
    const now = new Date();
    const contextData = {
      user: req.user.email,
      farmId: req.user.farmId,
      currentDate: now.toISOString(),
      // MOCK: Num cenário real carregaríamos o dashboard atual
      // dashboard: await this.dashboardService.getDashboardData(req.user.farmId, inicioMes, fimMes)
    };

    const reply = await this.aiService.processChat(message, contextData);
    
    return {
      success: true,
      reply
    };
  }
}
