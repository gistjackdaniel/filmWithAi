import { IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

// deprecated: 사용자 업로드는 UploadUserVideoV2V3RequestDto 사용
// export class CreateVideoRequestDto { ... }

export class UpdateVideoRequestDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) duration?: number;
  @IsOptional() @IsEnum(['uploaded', 'ai_generated']) type?: 'uploaded' | 'ai_generated';
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsEnum(['V2', 'V3']) track?: 'V2' | 'V3';
  @IsOptional() @IsNumber() order?: number;
}

// v1: 컷으로부터 fal.ai API를 이용하여 비디오 생성
export class GenerateVideoV1FromCutRequestDto {
  @IsMongoId()
  sourceCutId!: string;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => (value ?? undefined))
  sceneId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ?? undefined))
  prompt?: string;

  @IsOptional()
  @IsEnum(['720p', '1080p'])
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const v = String(value).toLowerCase().replace(/\s/g, '');
    if (v === '720' || v === '720p') return '720p';
    if (v === '1080' || v === '1080p') return '1080p';
    return undefined; // 유효하지 않으면 undefined로 정규화하여 기본값 사용
  })
  resolution?: '720p' | '1080p';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const v = String(value).trim();
    if (v === '8' || v === '8s') return '8s';
    return undefined; // 지원하는 값 외에는 기본값 사용
  })
  duration?: '8s'; // Veo3 Fast only supports 8s

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  generate_audio?: boolean;

  @IsEnum(['V2', 'V3'])
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  track!: 'V2' | 'V3';
}

// v2/v3: 사용자의 비디오 파일 업로드(메타데이터)
export class UploadUserVideoV2V3RequestDto {
  @IsOptional()
  @IsMongoId()
  sceneId?: string;

  @IsOptional()
  @IsMongoId()
  sourceCutId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  duration!: number;

  // 업로드 대상 트랙 (사용자 업로드는 V2/V3만)
  @IsEnum(['V2', 'V3'])
  track!: 'V2' | 'V3';

  // 파일 업로드를 쓰지 않고 외부 URL을 직접 저장하려는 경우에만 사용
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}


