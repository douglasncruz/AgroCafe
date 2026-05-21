import { Controller, Get, Post, Body, Param, Put, Patch, UseGuards, ValidationPipe } from '@nestjs/common';
import { HarvestsService } from './harvests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { CloseHarvestDto } from './dto/close-harvest.dto';
import { UpdateHarvestDto } from './dto/update-harvest.dto';

@Controller('api/harvests')
@UseGuards(JwtAuthGuard)
export class HarvestsController {
  constructor(private readonly harvestsService: HarvestsService) {}

  /**
   * Lista todas as safras de uma fazenda.
   */
  @Get('farm/:farmId')
  findAllByFarm(@Param('farmId') farmId: string) {
    return this.harvestsService.findAllByFarm(farmId);
  }

  /**
   * Retorna a safra ativa global (se existir).
   */
  @Get('active')
  getActiveHarvest() {
    return this.harvestsService.getGlobalActiveHarvest();
  }

  /**
   * Retorna a safra ativa de uma fazenda específica.
   */
  @Get('farm/:farmId/active')
  getActiveByFarm(@Param('farmId') farmId: string) {
    return this.harvestsService.findActiveByFarm(farmId);
  }

  /**
   * Retorna detalhes de uma safra específica.
   */
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.harvestsService.findById(id);
  }

  /**
   * Retorna o resumo financeiro de uma safra.
   */
  @Get(':id/summary')
  getHarvestSummary(@Param('id') id: string) {
    return this.harvestsService.getHarvestSummary(id);
  }

  /**
   * Cria uma nova safra.
   * Valida que não existe outra safra aberta para a mesma fazenda.
   */
  @Post()
  create(@Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateHarvestDto) {
    return this.harvestsService.create(dto);
  }

  /**
   * Atualiza detalhes da safra (incluindo datas).
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateHarvestDto,
  ) {
    return this.harvestsService.update(id, dto);
  }

  /**
   * Define uma safra como ativa para visualização no painel.
   */
  @Put(':id/set-active/farm/:farmId')
  setActive(@Param('id') id: string, @Param('farmId') farmId: string) {
    return this.harvestsService.setActive(farmId, id);
  }

  /**
   * Encerra uma safra aberta.
   * Após encerrar, novos lançamentos financeiros são bloqueados.
   */
  @Patch(':id/close')
  closeHarvest(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CloseHarvestDto,
  ) {
    return this.harvestsService.closeHarvest(id, dto);
  }

  /**
   * Arquiva uma safra encerrada.
   * Safra arquivada = somente leitura (consultas históricas).
   */
  @Patch(':id/archive')
  archiveHarvest(@Param('id') id: string) {
    return this.harvestsService.archiveHarvest(id);
  }

  /**
   * Reabre uma safra encerrada.
   */
  @Patch(':id/reopen')
  reopenHarvest(@Param('id') id: string) {
    return this.harvestsService.reopenHarvest(id);
  }
}
