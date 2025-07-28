"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, originalUrl, headers, body, query, params, ip, userAgent } = req;
        const userId = req.user?.userId || 'anonymous';
        const startTime = Date.now();
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
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const res = context.switchToHttp().getResponse();
            const duration = Date.now() - startTime;
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
        }), (0, operators_1.catchError)((error) => {
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
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map