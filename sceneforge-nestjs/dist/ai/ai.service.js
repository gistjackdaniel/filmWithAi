"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let AiService = AiService_1 = class AiService {
    configService;
    logger = new common_1.Logger(AiService_1.name);
    openaiApiKey;
    openaiBaseUrl = 'https://api.openai.com/v1';
    constructor(configService) {
        this.configService = configService;
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        if (this.openaiApiKey === '') {
            this.logger.error('OpenAI API 키가 설정되지 않았습니다.');
        }
    }
    async callChatCompletions(messages, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.openaiBaseUrl}/chat/completions`, {
                model: options.model || 'gpt-4o',
                messages,
                max_tokens: options.max_tokens || 10000,
                temperature: options.temperature || 0.7,
                ...options
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: options.timeout || 60000
            });
            return response.data.choices[0].message.content.trim();
        }
        catch (error) {
            this.logger.error('OpenAI API 호출 중 오류 발생:', error.message);
            throw new common_1.BadRequestException('AI 서비스 호출에 실패했습니다.');
        }
    }
    async callImageGenerations(prompt, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.openaiBaseUrl}/images/generations`, {
                model: options.model || 'dall-e-3',
                prompt,
                n: options.n || 1,
                size: options.size || '1024x1024',
                quality: options.quality || 'standard',
                ...options
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: options.timeout || 60000
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('OpenAI Images API 호출 중 오류 발생:', error.message);
            throw new common_1.BadRequestException('이미지 생성에 실패했습니다.');
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map