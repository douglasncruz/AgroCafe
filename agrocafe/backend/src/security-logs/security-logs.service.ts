import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityLog } from './entities/security-log.entity';

export interface CreateLogDto {
  userId?: string;
  userName?: string;
  action: string;
  moduleName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  status: string;
}

@Injectable()
export class SecurityLogsService {
  constructor(
    @InjectRepository(SecurityLog)
    private logsRepository: Repository<SecurityLog>,
  ) {}

  async createLog(dto: CreateLogDto) {
    const log = this.logsRepository.create({
      user_id: dto.userId,
      user_name: dto.userName,
      action: dto.action,
      module_name: dto.moduleName,
      record_id: dto.recordId,
      old_values: dto.oldValues,
      new_values: dto.newValues,
      ip_address: dto.ipAddress,
      user_agent: dto.userAgent,
      status: dto.status,
    });
    return this.logsRepository.save(log);
  }

  async findAll(query: any) {
    const qb = this.logsRepository.createQueryBuilder('log');
    
    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }
    if (query.module) {
      qb.andWhere('log.module_name = :module', { module: query.module });
    }
    if (query.userId) {
      qb.andWhere('log.user_id = :userId', { userId: query.userId });
    }
    if (query.status) {
      qb.andWhere('log.status = :status', { status: query.status });
    }

    qb.orderBy('log.created_at', 'DESC');

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0,0,0,0);

    const failedLogins = await this.logsRepository.count({
      where: {
        action: 'LOGIN_FAILED',
      }
    });

    const totalLogsToday = await this.logsRepository
      .createQueryBuilder('log')
      .where('log.created_at >= :today', { today })
      .getCount();

    const topActions = await this.logsRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(log.id)', 'count')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      failedLogins,
      totalLogsToday,
      topActions
    };
  }
}
