import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ResponseLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;

    // 응답 데이터를 가로채기
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const { method, originalUrl } = req;

      // 응답 데이터 크기 제한
      let responseData = data;
      if (typeof data === 'string' && data.length > 1000) {
        responseData = data.substring(0, 1000) + '... [TRUNCATED]';
      }

      console.log('🟢 [MIDDLEWARE - RESPONSE]', {
        timestamp: new Date().toISOString(),
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
        response: responseData,
        requestId: req.headers['x-request-id'] || 'unknown',
      });

      return originalSend.call(this, data);
    };

    // 에러 처리
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      const { method, originalUrl } = req;

      console.error('🔴 [MIDDLEWARE - ERROR]', {
        timestamp: new Date().toISOString(),
        method,
        url: originalUrl,
        statusCode: res.statusCode || 500,
        duration: `${duration}ms`,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    });

    next();
  }
} 