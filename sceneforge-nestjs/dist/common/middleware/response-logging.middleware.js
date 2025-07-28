"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseLoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
let ResponseLoggingMiddleware = class ResponseLoggingMiddleware {
    use(req, res, next) {
        const startTime = Date.now();
        const originalSend = res.send;
        res.send = function (data) {
            const duration = Date.now() - startTime;
            const { method, originalUrl } = req;
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
};
exports.ResponseLoggingMiddleware = ResponseLoggingMiddleware;
exports.ResponseLoggingMiddleware = ResponseLoggingMiddleware = __decorate([
    (0, common_1.Injectable)()
], ResponseLoggingMiddleware);
//# sourceMappingURL=response-logging.middleware.js.map