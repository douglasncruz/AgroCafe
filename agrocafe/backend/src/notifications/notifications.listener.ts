import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationPriority } from './entities/notification.entity';

@Injectable()
export class NotificationsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('user.created')
  handleUserCreatedEvent(user: any) {
    // Notify globally that a new user was created
    this.notificationsService.createNotification({
      type: NotificationType.SEGURANCA,
      priority: NotificationPriority.INFO,
      title: 'Novo Usuário Cadastrado',
      message: `O usuário ${user.name} (${user.email}) foi registrado no sistema.`,
      action_link: '/dashboard/users'
    });
  }

  @OnEvent('expense.created')
  handleExpenseCreatedEvent(expense: any) {
    if (Number(expense.amount) >= 50000) {
      this.notificationsService.createNotification({
        farmId: expense.farm?.id,
        type: NotificationType.FINANCEIRO,
        priority: NotificationPriority.WARNING,
        title: 'Despesa de Alto Valor',
        message: `Uma despesa no valor de R$ ${Number(expense.amount).toLocaleString('pt-BR')} foi registrada (${expense.description}).`,
        action_link: '/dashboard/expenses'
      });
    }
  }
}
