import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const userId = req.user?.userId || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;

        // 응답 데이터 크기 제한 (너무 큰 응답은 잘라서 로깅)
        let responseData = data;
        if (typeof data === 'object' && data !== null) {
          const dataString = JSON.stringify(data);
          if (dataString.length > 1000) {
            responseData = {
              ...data,
              _truncated: true,
              _originalSize: dataString.length,
              _preview: dataString.substring(0, 1000) + '...',
            };
          }
        }

        console.log('🟢 [RESPONSE]', {
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          userId,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          responseSize: JSON.stringify(data).length,
          response: responseData,
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }),
      catchError((error) => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;

        console.error('🔴 [ERROR]', {
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          userId,
          statusCode: res.statusCode || 500,
          duration: `${duration}ms`,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          requestId: req.headers['x-request-id'] || 'unknown',
        });

        throw error;
      }),
    );
  }
} 