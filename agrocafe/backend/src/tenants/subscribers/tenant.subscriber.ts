import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { requestContext } from '../../common/context/request-context';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  
  // Intercept all inserts
  async beforeInsert(event: InsertEvent<any>) {
    const context = requestContext.getStore();
    
    // Only inject tenant_id if the entity has the column and it is not explicitly set
    if (context && context.tenantId) {
      // Check if entity has tenant_id property (we can check metadata or just if it's undefined)
      const hasTenantIdColumn = event.metadata.columns.some(col => col.propertyName === 'tenant_id');
      
      if (hasTenantIdColumn && event.entity) {
        if (!event.entity.tenant_id) {
          event.entity.tenant_id = context.tenantId;
        }
      }
    }
  }
}
