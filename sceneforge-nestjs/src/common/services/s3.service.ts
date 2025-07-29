import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'sceneforge-images';
    
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION') || 'ap-northeast-2',
    });
    
    this.logger.log('S3 서비스 초기화 완료');
  }

  async uploadImage(
    imageData: string,
    fileName: string
  ): Promise<string> {
    try {
      // base64 데이터에서 실제 이미지 데이터 추출
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const key = `cuts/${Date.now()}_${fileName}`;
      const mimeType = this.getMimeType(fileName);

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
      };

      const result = await this.s3.upload(uploadParams).promise();
      this.logger.log(`S3 이미지 업로드 성공: ${result.Location}`);
      
      return result.Location;
    } catch (error) {
      this.logger.error('S3 이미지 업로드 실패:', error);
      throw new Error('S3 이미지 업로드에 실패했습니다.');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(imageUrl);
      
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`S3 이미지 삭제 성공: ${key}`);
    } catch (error) {
      this.logger.error('S3 이미지 삭제 실패:', error);
      throw new Error('S3 이미지 삭제에 실패했습니다.');
    }
  }

  private getMimeType(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  private extractKeyFromUrl(url: string): string {
    // S3 URL에서 키 추출 (예: https://bucket.s3.region.amazonaws.com/cuts/filename.jpg)
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // bucket/region 이후 부분
  }

  getStorageInfo(): { type: string; bucket: string } {
    return {
      type: 'S3',
      bucket: this.bucketName
    };
  }
} 