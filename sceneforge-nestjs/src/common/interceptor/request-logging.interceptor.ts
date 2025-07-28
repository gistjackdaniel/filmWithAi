import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, headers, body, query, params, ip, userAgent } = req;
    const userId = req.user?.userId || 'anonymous';

    // 민감한 정보 제거
    const sanitizedHeaders = { ...headers };
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;

    const sanitizedBody = { ...body };
    if (sanitizedBody.password) {
      sanitizedBody.password = '[REDACTED]';
    }
    if (sanitizedBody.access_token) {
      sanitizedBody.access_token = '[REDACTED]';
    }

    console.log('🔵 [REQUEST]', {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      userId,
      ip,
      userAgent,
      headers: sanitizedHeaders,
      query,
      params,
      body: sanitizedBody,
      requestId: req.headers['x-request-id'] || 'unknown',
    });

    return next.handle();
  }
} 