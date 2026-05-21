import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockItem } from './entities/stock-item.entity';
import { StockTransaction } from './entities/stock-transaction.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private itemRepo: Repository<StockItem>,
    @InjectRepository(StockTransaction)
    private transactionRepo: Repository<StockTransaction>,
  ) {}

  async findAll(farmId: string): Promise<StockItem[]> {
    return this.itemRepo.find({
      where: { farm: { id: farmId } },
      order: { product_name: 'ASC' },
    });
  }

  async findAllTransactions(farmId: string): Promise<StockTransaction[]> {
    return this.transactionRepo.find({
      where: { farm: { id: farmId } },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async createTransaction(dto: any): Promise<StockTransaction> {
    const { farmId, product_name, type, quantity, unit, date, unit_price, notes, category, min_quantity } = dto;

    if (!farmId || !product_name || !type || quantity === undefined || !unit || !date) {
      throw new BadRequestException('Todos os campos obrigatórios devem ser fornecidos.');
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new BadRequestException('A quantidade deve ser um número maior que zero.');
    }

    const price = unit_price !== undefined && unit_price !== null ? Number(unit_price) : undefined;

    // 1. Criar transação
    const transaction = this.transactionRepo.create({
      product_name,
      type,
      quantity: qty,
      unit,
      date: new Date(date),
      unit_price: price,
      notes,
      farm: { id: farmId } as any,
    });

    const savedTx = await this.transactionRepo.save(transaction);

    // 2. Atualizar ou Criar Item de Estoque
    let item = await this.itemRepo.findOne({
      where: { farm: { id: farmId }, product_name },
    });

    const change = type === 'ENTRADA' ? qty : -qty;

    if (item) {
      item.quantity = Number(item.quantity) + change;
      if (category) item.category = category;
      if (min_quantity !== undefined) item.min_quantity = Number(min_quantity);
      await this.itemRepo.save(item);
    } else {
      const newItem = this.itemRepo.create({
        product_name,
        category: category || (type === 'SAIDA' ? 'Defensivo' : 'Outro'),
        quantity: change,
        unit,
        min_quantity: min_quantity !== undefined ? Number(min_quantity) : 0,
        farm: { id: farmId } as any,
      });
      await this.itemRepo.save(newItem);
    }

    return savedTx;
  }
}
