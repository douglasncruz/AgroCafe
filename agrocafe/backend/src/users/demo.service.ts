import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Harvest } from '../harvests/entities/harvest.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Revenue } from '../revenues/entities/revenue.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Farm) private farmRepository: Repository<Farm>,
    @InjectRepository(Harvest) private harvestRepository: Repository<Harvest>,
    @InjectRepository(Expense) private expenseRepository: Repository<Expense>,
    @InjectRepository(Revenue) private revenueRepository: Repository<Revenue>,
  ) {}

  async resetDemoEnvironment() {
    this.logger.log('Iniciando Reset Automático do Ambiente de Demonstração...');

    const demoEmail = 'chico.cafezal@agrocerradocafe.com.br';
    let demoUser = await this.userRepository.findOne({ where: { email: demoEmail } });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('Chico@2026', salt);
      demoUser = this.userRepository.create({
        name: 'Chico Cafezal',
        email: demoEmail,
        password_hash,
        is_demo: true,
      });
      demoUser = await this.userRepository.save(demoUser);
    }

    // Deletar Fazendas (Cascade deletes harvests, expenses, revenues if configured correctly)
    const farms = await this.farmRepository.find({ where: { user: { id: demoUser.id } } });
    if (farms.length > 0) {
      // Remover entidades filhas manualmente caso não haja OnDelete('CASCADE') no entity
      for (const farm of farms) {
        const harvests = await this.harvestRepository.find({ where: { farm: { id: farm.id } } });
        for (const harvest of harvests) {
          await this.expenseRepository.delete({ harvest: { id: harvest.id } });
          await this.revenueRepository.delete({ harvest: { id: harvest.id } });
        }
        await this.harvestRepository.delete({ farm: { id: farm.id } });
      }
      await this.farmRepository.remove(farms);
    }

    // Criar Dados Fictícios
    const farm = this.farmRepository.create({
      name: 'Agro Cerrado Café (Demonstração)',
      city: 'Patrocínio',
      state: 'MG',
      total_area_hectares: 150,
      user: demoUser,
    });
    const savedFarm = await this.farmRepository.save(farm);

    // Safra Passada
    const harvest2023 = this.harvestRepository.create({
      name: 'Safra 2023/2024',
      year: 2023,
      start_date: new Date('2023-05-01'),
      end_date: new Date('2024-04-30'),
      is_active: false,
      farm: savedFarm,
    });
    const savedHarvest2023 = await this.harvestRepository.save(harvest2023);

    // Safra Atual
    const harvest2024 = this.harvestRepository.create({
      name: 'Safra 2024/2025',
      year: 2024,
      start_date: new Date('2024-05-01'),
      end_date: null,
      is_active: true,
      farm: savedFarm,
    });
    const savedHarvest2024 = await this.harvestRepository.save(harvest2024);

    // Despesas e Receitas - 2023
    await this.expenseRepository.save([
      { description: 'Fertilizantes NPK', amount: 150000, date: new Date('2023-06-15'), category: 'Insumos', harvest: savedHarvest2023, user: demoUser },
      { description: 'Defensivos Agrícolas', amount: 80000, date: new Date('2023-08-20'), category: 'Insumos', harvest: savedHarvest2023, user: demoUser },
      { description: 'Mão de Obra Colheita', amount: 120000, date: new Date('2023-11-10'), category: 'Mão de Obra', harvest: savedHarvest2023, user: demoUser },
    ]);
    await this.revenueRepository.save([
      { description: 'Venda de Café Cereja (Bica Corrida)', amount: 650000, date: new Date('2024-01-15'), category: 'Venda', harvest: savedHarvest2023, user: demoUser },
    ]);

    // Despesas - 2024
    await this.expenseRepository.save([
      { description: 'Calcário e Gesso', amount: 45000, date: new Date('2024-05-10'), category: 'Insumos', harvest: savedHarvest2024, user: demoUser },
      { description: 'Manutenção de Tratores', amount: 15000, date: new Date('2024-06-05'), category: 'Manutenção', harvest: savedHarvest2024, user: demoUser },
    ]);

    this.logger.log('Ambiente de Demonstração restaurado com sucesso!');
  }
}
