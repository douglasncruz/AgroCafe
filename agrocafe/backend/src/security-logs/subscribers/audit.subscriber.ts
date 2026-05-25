import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { SecurityLog } from '../entities/security-log.entity';
import { requestContext } from '../../common/context/request-context';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  
  // We do not define listenTo() so it listens to ALL entities
  
  private async createLog(event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>, action: string, oldValues: any = null, newValues: any = null) {
    if (event.metadata.targetName === 'SecurityLog') return; // Do not log the log itself
    if (event.metadata.targetName === 'Notification') return; // Do not log notifications
    
    const context = requestContext.getStore();
    
    const log = new SecurityLog();
    log.action = action;
    log.module_name = event.metadata.targetName;
    log.record_id = event.entity?.id || (event as any).databaseEntity?.id;
    log.old_values = oldValues;
    log.new_values = newValues;
    log.status = 'SUCCESS';
    
    if (context) {
      log.user_id = context.userId || null;
      log.user_name = context.userName || null;
      log.ip_address = context.ipAddress || null;
      log.user_agent = context.userAgent || null;
    }

    try {
      await event.manager.getRepository(SecurityLog).save(log);
    } catch (error) {
      console.error('Error saving security log:', error);
    }
  }

  async afterInsert(event: InsertEvent<any>) {
    await this.createLog(event, 'CREATE', null, event.entity);
  }

  async beforeUpdate(event: UpdateEvent<any>) {
    await this.createLog(event, 'UPDATE', event.databaseEntity, event.entity);
  }

  async beforeRemove(event: RemoveEvent<any>) {
    await this.createLog(event, 'DELETE', event.databaseEntity, null);
  }
}
