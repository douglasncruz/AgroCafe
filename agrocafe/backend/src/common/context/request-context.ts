import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  environmentType?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextData>();
