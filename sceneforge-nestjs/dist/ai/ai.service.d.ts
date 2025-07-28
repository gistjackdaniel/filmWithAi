import { ConfigService } from '@nestjs/config';
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatCompletionsOptions {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    timeout?: number;
    [key: string]: any;
}
export interface ImageGenerationOptions {
    model?: string;
    n?: number;
    size?: string;
    quality?: string;
    timeout?: number;
    [key: string]: any;
}
export declare class AiService {
    private configService;
    private readonly logger;
    private readonly openaiApiKey;
    private readonly openaiBaseUrl;
    constructor(configService: ConfigService);
    callChatCompletions(messages: ChatMessage[], options?: ChatCompletionsOptions): Promise<string>;
    callImageGenerations(prompt: string, options?: ImageGenerationOptions): Promise<any>;
}
