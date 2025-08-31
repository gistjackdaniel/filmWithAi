export class VideoResponseDto {
  _id: string;
  projectId: string;
  sceneId?: string;
  sourceCutId?: string;
  title: string;
  description?: string;
  duration: number;
  type: 'uploaded' | 'ai_generated';
  videoUrl?: string;
  track: 'V2' | 'V3' | string;
  order: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class GenerateVideoV1FromCutResponseDto extends VideoResponseDto {}

export class UploadUserVideoV2V3ResponseDto extends VideoResponseDto {}


