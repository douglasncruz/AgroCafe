import { Controller, Get, Post, Put, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  async getUnread(@Query('farmId') farmId: string) {
    if (!farmId) return [];
    return this.notificationsService.getUnreadForFarm(farmId);
  }

  @Get('recent')
  async getRecent(@Query('farmId') farmId: string, @Query('limit') limit: number) {
    if (!farmId) return [];
    return this.notificationsService.getRecentForFarm(farmId, limit || 50);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('read-all')
  async markAllAsRead(@Query('farmId') farmId: string) {
    if (farmId) {
      return this.notificationsService.markAllAsReadForFarm(farmId);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}
