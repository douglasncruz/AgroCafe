import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Harvest, HarvestStatus } from './entities/harvest.entity';
import { Farm } from '../farms/entities/farm.entity';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { CloseHarvestDto } from './dto/close-harvest.dto';

@Injectable()
export class HarvestsService {
  constructor(
    @InjectRepository(Harvest)
    private harvestsRepository: Repository<Harvest>,
    @InjectRepository(Farm)
    private farmsRepository: Repository<Farm>,
  ) {}

  /**
   * Lista todas as safras de uma fazenda, ordenadas por data de criação (mais recente primeiro).
   */
  async findAllByFarm(farmId: string): Promise<Harvest[]> {
    return this.harvestsRepository.find({
      where: { farm: { id: farmId } },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Retorna a safra ativa de uma fazenda.
   */
  async findActiveByFarm(farmId: string): Promise<Harvest | null> {
    return this.harvestsRepository.findOne({
      where: { farm: { id: farmId }, is_active: true, status: HarvestStatus.ABERTA },
    });
  }

  /**
   * Retorna detalhes de uma safra específica pelo ID.
   */
  async findById(id: string): Promise<Harvest> {
    const harvest = await this.harvestsRepository.findOne({
      where: { id },
      relations: ['farm'],
    });
    if (!harvest) {
      throw new NotFoundException('Safra não encontrada.');
    }
    return harvest;
  }

  /**
   * Cria uma nova safra para a fazenda.
   * Regras:
   *  - A fazenda deve existir
   *  - Não pode haver outra safra com status "Aberta" na mesma fazenda
   *  - A primeira safra criada é automaticamente ativada
   */
  async create(dto: CreateHarvestDto): Promise<Harvest> {
    const farm = await this.farmsRepository.findOne({ where: { id: dto.farmId } });
    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada.');
    }

    // Verificar se já existe safra aberta para esta fazenda
    const existingOpen = await this.harvestsRepository.findOne({
      where: { farm: { id: dto.farmId }, status: HarvestStatus.ABERTA },
    });

    if (existingOpen) {
      throw new BadRequestException(
        `Já existe uma safra aberta para esta fazenda: "${existingOpen.name}". Encerre-a antes de abrir uma nova.`
      );
    }

    const harvest = this.harvestsRepository.create({
      name: dto.name,
      year: dto.year,
      notes: dto.notes,
      farm,
      is_active: true, // Nova safra aberta sempre se torna a ativa
      status: HarvestStatus.ABERTA,
      start_date: new Date(),
    });

    // Desativar outras safras desta fazenda
    await this.harvestsRepository.update(
      { farm: { id: dto.farmId } },
      { is_active: false },
    );

    return this.harvestsRepository.save(harvest);
  }

  /**
   * Define uma safra como ativa (para visualização).
   * Não muda o status — apenas indica qual safra está selecionada no painel.
   */
  async setActive(farmId: string, harvestId: string): Promise<{ success: boolean }> {
    const harvest = await this.harvestsRepository.findOne({
      where: { id: harvestId, farm: { id: farmId } },
    });
    if (!harvest) {
      throw new NotFoundException('Safra não encontrada para esta fazenda.');
    }

    // Desativa todas da fazenda
    await this.harvestsRepository.update({ farm: { id: farmId } }, { is_active: false });
    // Ativa a selecionada
    await this.harvestsRepository.update(harvestId, { is_active: true });

    return { success: true };
  }

  /**
   * Encerra uma safra.
   * Regras:
   *  - Apenas safras com status "Aberta" podem ser encerradas
   *  - Define end_date como a data atual
   *  - Após encerrar, novos lançamentos são bloqueados pelo HarvestValidationService
   */
  async closeHarvest(id: string, dto?: CloseHarvestDto): Promise<Harvest> {
    const harvest = await this.findById(id);

    if (harvest.status !== HarvestStatus.ABERTA) {
      throw new BadRequestException(
        `A safra "${harvest.name}" não pode ser encerrada pois seu status atual é "${harvest.status}".`
      );
    }

    harvest.status = HarvestStatus.ENCERRADA;
    harvest.end_date = new Date();
    if (dto?.notes) {
      harvest.notes = harvest.notes
        ? `${harvest.notes}\n[Encerramento] ${dto.notes}`
        : `[Encerramento] ${dto.notes}`;
    }

    return this.harvestsRepository.save(harvest);
  }

  /**
   * Arquiva uma safra encerrada.
   * Regras:
   *  - Apenas safras com status "Encerrada" podem ser arquivadas
   *  - Safra arquivada é somente leitura (consultas históricas)
   */
  async archiveHarvest(id: string): Promise<Harvest> {
    const harvest = await this.findById(id);

    if (harvest.status !== HarvestStatus.ENCERRADA) {
      throw new BadRequestException(
        `Apenas safras encerradas podem ser arquivadas. A safra "${harvest.name}" está com status "${harvest.status}".`
      );
    }

    harvest.status = HarvestStatus.ARQUIVADA;
    harvest.is_active = false;

    return this.harvestsRepository.save(harvest);
  }

  /**
   * Retorna a safra ativa (global — primeira encontrada).
   * Usado no frontend para saber se existe alguma safra aberta.
   */
  async getGlobalActiveHarvest(): Promise<Harvest | null> {
    return this.harvestsRepository.findOne({
      where: { is_active: true, status: HarvestStatus.ABERTA },
      relations: ['farm'],
    });
  }

  /**
   * Retorna um resumo financeiro simplificado de uma safra.
   */
  async getHarvestSummary(id: string) {
    const harvest = await this.harvestsRepository.findOne({
      where: { id },
      relations: ['expenses', 'revenues', 'farm'],
    });

    if (!harvest) {
      throw new NotFoundException('Safra não encontrada.');
    }

    const totalExpenses = (harvest.expenses || []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalRevenues = (harvest.revenues || []).reduce(
      (sum, r) => sum + Number(r.total_value),
      0,
    );
    const totalSacks = (harvest.revenues || []).reduce(
      (sum, r) => sum + Number(r.sacks_sold),
      0,
    );

    return {
      harvest: {
        id: harvest.id,
        name: harvest.name,
        year: harvest.year,
        status: harvest.status,
        start_date: harvest.start_date,
        end_date: harvest.end_date,
        farm: harvest.farm?.name,
      },
      totalExpenses,
      totalRevenues,
      netProfit: totalRevenues - totalExpenses,
      totalSacks,
      avgPricePerSack: totalSacks > 0 ? totalRevenues / totalSacks : 0,
      expenseCount: (harvest.expenses || []).length,
      revenueCount: (harvest.revenues || []).length,
    };
  }
}
