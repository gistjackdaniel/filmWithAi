"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RequestLoggingMiddleware = class RequestLoggingMiddleware {
    use(req, res, next) {
        const { method, originalUrl, headers, body, query, params, ip } = req;
        const userAgent = req.get('User-Agent') || 'unknown';
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
};
exports.RequestLoggingMiddleware = RequestLoggingMiddleware;
exports.RequestLoggingMiddleware = RequestLoggingMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestLoggingMiddleware);
//# sourceMappingURL=request-logging.middleware.js.map