import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Harvest, HarvestStatus } from './entities/harvest.entity';

/**
 * Serviço centralizado de validação de safras.
 * Compartilhado entre ExpensesService e RevenuesService para garantir
 * que toda movimentação financeira esteja vinculada a uma safra válida.
 */
@Injectable()
export class HarvestValidationService {
  constructor(
    @InjectRepository(Harvest)
    private harvestsRepository: Repository<Harvest>,
  ) {}

  /**
   * Valida que o harvestId informado corresponde a uma safra aberta.
   * Lança exceção se:
   *  - harvestId não foi informado
   *  - a safra não existe
   *  - a safra não está com status "Aberta"
   */
  async validateForFinancialEntry(harvestId?: string): Promise<Harvest> {
    if (!harvestId) {
      throw new BadRequestException(
        'É obrigatório vincular o lançamento a uma safra. Abra uma safra antes de registrar movimentações financeiras.'
      );
    }

    const harvest = await this.harvestsRepository.findOne({
      where: { id: harvestId },
      relations: ['farm'],
    });

    if (!harvest) {
      throw new BadRequestException(
        'Safra não encontrada. Verifique se a safra selecionada existe.'
      );
    }

    if (harvest.status === HarvestStatus.ENCERRADA) {
      throw new ForbiddenException(
        `A safra "${harvest.name}" está encerrada. Não é permitido realizar novos lançamentos em safras encerradas. Apenas consultas e relatórios são permitidos.`
      );
    }

    if (harvest.status === HarvestStatus.ARQUIVADA) {
      throw new ForbiddenException(
        `A safra "${harvest.name}" está arquivada. Nenhuma alteração é permitida. Somente consultas históricas.`
      );
    }

    return harvest;
  }

  /**
   * Retorna a safra ativa global (pode ser de qualquer fazenda).
   * Útil para o frontend saber se existe alguma safra ativa.
   */
  async getActiveHarvest(): Promise<Harvest | null> {
    return this.harvestsRepository.findOne({
      where: { is_active: true, status: HarvestStatus.ABERTA },
      relations: ['farm'],
    });
  }

  /**
   * Retorna a safra ativa de uma fazenda específica.
   */
  async getActiveHarvestByFarm(farmId: string): Promise<Harvest | null> {
    return this.harvestsRepository.findOne({
      where: { farm: { id: farmId }, is_active: true, status: HarvestStatus.ABERTA },
      relations: ['farm'],
    });
  }
}
