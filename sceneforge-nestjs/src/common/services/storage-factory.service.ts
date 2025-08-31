import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { LocalStorageService } from './local-storage.service';

export interface StorageService {
  uploadImage(imageData: string, fileName: string): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
  getStorageInfo(): { type: string; bucket?: string; localPath?: string };
  uploadFromUrl?(fileUrl: string, fileName: string, contentType?: string, targetFolder?: string): Promise<string>;
  deleteFile?(fileUrl: string): Promise<void>;
}

@Injectable()
export class StorageFactoryService {
  private readonly logger = new Logger(StorageFactoryService.name);
  private storageService: StorageService;

  constructor(
    private configService: ConfigService,
    private s3Service: S3Service,
    private localStorageService: LocalStorageService
  ) {
    this.initializeStorageService();
  }

  private initializeStorageService() {
    const useS3 = this.configService.get<boolean>('USE_S3') || false;
    
    if (useS3) {
      this.storageService = this.s3Service;
      this.logger.log('S3 스토리지 서비스가 선택되었습니다.');
    } else {
      this.storageService = this.localStorageService;
      this.logger.log('로컬 스토리지 서비스가 선택되었습니다.');
    }
  }

  getStorageService(): StorageService {
    return this.storageService;
  }

  async uploadImage(imageData: string, fileName: string): Promise<string> {
    return this.storageService.uploadImage(imageData, fileName);
  }

  async deleteImage(imageUrl: string): Promise<void> {
    return this.storageService.deleteImage(imageUrl);
  }

  async uploadFromUrl(fileUrl: string, fileName: string, contentType?: string, targetFolder?: string): Promise<string> {
    if (!this.storageService.uploadFromUrl) throw new Error('uploadFromUrl not implemented for current storage');
    return this.storageService.uploadFromUrl(fileUrl, fileName, contentType, targetFolder);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (this.storageService.deleteFile) return this.storageService.deleteFile(fileUrl);
    // fallback for legacy method names
    return this.storageService.deleteImage(fileUrl);
  }

  getStorageInfo(): { type: string; bucket?: string; localPath?: string } {
    return this.storageService.getStorageInfo();
  }
} 