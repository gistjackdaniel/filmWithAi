import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// DTO 정의
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

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl = 'https://api.openai.com/v1';
  private readonly tempDir: string;

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
    
    if (this.openaiApiKey === '') {
      this.logger.error('OpenAI API 키가 설정되지 않았습니다.');
    }
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * OpenAI Chat Completions API 호출
   */
  async callChatCompletions(messages: ChatMessage[], options: ChatCompletionsOptions = {}): Promise<string> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: options.model || 'gpt-4o',
          messages,
          max_tokens: options.max_tokens || 10000,
          temperature: options.temperature || 0.7,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: options.timeout || 60000
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      this.logger.error('OpenAI API 호출 중 오류 발생:', error.message);
      throw new BadRequestException('AI 서비스 호출에 실패했습니다.');
    }
  }

  /**
   * OpenAI Images API 호출
   */
  async callImageGenerations(prompt: string, options: ImageGenerationOptions = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/images/generations`,
        {
          model: options.model || 'dall-e-3',
          prompt,
          n: options.n || 1,
          size: options.size || '1024x1024',
          quality: options.quality || 'standard',
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: options.timeout || 60000
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('OpenAI Images API 호출 중 오류 발생:', error.message);
      throw new BadRequestException('이미지 생성에 실패했습니다.');
    }
  }

  /**
   * 이미지 URL을 파일로 다운로드
   */
  async downloadImageFromUrl(imageUrl: string, fileName: string): Promise<string> {
    try {
      this.logger.log(`이미지 다운로드 시작: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const filePath = path.join(this.tempDir, fileName);
      fs.writeFileSync(filePath, response.data);

      this.logger.log(`이미지 다운로드 완료: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error('이미지 다운로드 실패:', error.message);
      throw new BadRequestException('이미지 다운로드에 실패했습니다.');
    }
  }

  /**
   * 임시 파일 삭제
   */
  async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`임시 파일 삭제 완료: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn('임시 파일 삭제 실패:', error.message);
    }
  }
} 