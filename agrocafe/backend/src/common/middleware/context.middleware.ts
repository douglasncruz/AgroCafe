import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext, RequestContextData } from '../context/request-context';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let userId: string | undefined;
    let userName: string | undefined;
    let tenantId: string | undefined;
    let environmentType: string | undefined;

    // Try to extract user from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode JWT payload manually (Base64Url decode)
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const decoded = JSON.parse(payloadJson);
          if (decoded) {
            userId = decoded.sub; // assuming sub is user id
            userName = decoded.name || decoded.email; // assuming token has email or name
            tenantId = decoded.tenant_id;
            environmentType = decoded.environment_type;
          }
        }
      } catch (err) {
        // ignore invalid token here, auth guard will handle it
      }
    }

    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const userAgent = req.headers['user-agent'] || '';

    const contextData: RequestContextData = {
      userId,
      userName,
      ipAddress,
      userAgent,
      tenantId,
      environmentType,
    };

    requestContext.run(contextData, () => {
      next();
    });
  }
}
