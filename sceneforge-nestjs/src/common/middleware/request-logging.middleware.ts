import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers, body, query, params, ip } = req;
    const userAgent = req.get('User-Agent') || 'unknown';

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

    console.log('🔵 [MIDDLEWARE - REQUEST]', {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      ip,
      userAgent,
      headers: sanitizedHeaders,
      query,
      params,
      body: sanitizedBody,
      requestId: req.headers['x-request-id'] || 'unknown',
    });

    next();
  }
} 