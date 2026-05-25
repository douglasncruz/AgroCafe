import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway
  ) {}

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  async createNotification(data: {
    farmId?: string;
    userId?: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    action_link?: string;
  }) {
    const notification = this.notificationsRepository.create({
      farm: data.farmId ? { id: data.farmId } : undefined,
      user: data.userId ? { id: data.userId } : undefined,
      type: data.type,
      priority: data.priority,
      title: data.title,
      message: data.message,
      action_link: data.action_link
    });
    
    const saved = await this.notificationsRepository.save(notification);

    // Push in real time
    if (data.farmId) {
      this.notificationsGateway.notifyFarm(data.farmId, saved);
    } else if (data.userId) {
      this.notificationsGateway.notifyUser(data.userId, saved);
    } else {
      this.notificationsGateway.notifyAll(saved);
    }

    return saved;
  }

  async getUnreadForFarm(farmId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: [
        { farm: { id: farmId }, is_read: false, tenant_id: this.getTenantId() },
        { farm: undefined, user: undefined, is_read: false, tenant_id: this.getTenantId() } // Global notifications
      ],
      order: { created_at: 'DESC' }
    });
  }

  async getRecentForFarm(farmId: string, limit = 50): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: [
        { farm: { id: farmId }, tenant_id: this.getTenantId() },
        { farm: undefined, user: undefined, tenant_id: this.getTenantId() } 
      ],
      order: { created_at: 'DESC' },
      take: limit
    });
  }

  async markAsRead(id: string) {
    await this.notificationsRepository.update(id, { is_read: true });
  }

  async markAllAsReadForFarm(farmId: string) {
    await this.notificationsRepository.update({ farm: { id: farmId }, is_read: false, tenant_id: this.getTenantId() }, { is_read: true });
  }

  async deleteNotification(id: string) {
    await this.notificationsRepository.delete(id);
  }
}
