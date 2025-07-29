import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'images');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(
    imageData: string,
    fileName: string
  ): Promise<string> {
    try {
      // base64 데이터에서 실제 이미지 데이터 추출
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // 파일 저장
      const filePath = path.join(this.uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // URL 반환
      const imageUrl = `/uploads/images/${fileName}`;
      this.logger.log(`로컬 이미지 업로드 성공: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      this.logger.error('로컬 이미지 업로드 실패:', error);
      throw new Error('로컬 이미지 업로드에 실패했습니다.');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const fileName = path.basename(imageUrl);
      const filePath = path.join(this.uploadDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`로컬 이미지 삭제 성공: ${fileName}`);
      }
    } catch (error) {
      this.logger.error('로컬 이미지 삭제 실패:', error);
      throw new Error('로컬 이미지 삭제에 실패했습니다.');
    }
  }

  getStorageInfo(): { type: string; localPath: string } {
    return {
      type: 'Local',
      localPath: this.uploadDir
    };
  }
} 