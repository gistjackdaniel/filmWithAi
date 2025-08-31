import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { fal } from '@fal-ai/client';
import { Video, VideoDocument } from './schema/video.schema';
import { UploadUserVideoV2V3RequestDto, UpdateVideoRequestDto, GenerateVideoV1FromCutRequestDto } from './dto/request.dto';
import { VideoResponseDto } from './dto/response.dto';
import { CutService } from '../cut/cut.service';
import { Inject, forwardRef } from '@nestjs/common';
import { StorageFactoryService } from '../common/services/storage-factory.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    private configService: ConfigService,
    @Inject(forwardRef(() => CutService)) private cutService: CutService,
    private storageFactory: StorageFactoryService,
  ) {}

  private toDto(doc: VideoDocument): VideoResponseDto {
    return {
      _id: doc._id.toString(),
      projectId: doc.projectId.toString(),
      sceneId: doc.sceneId?.toString(),
      sourceCutId: doc.sourceCutId?.toString(),
      title: doc.title,
      description: doc.description,
      duration: doc.duration,
      type: doc.type,
      videoUrl: doc.videoUrl,
      track: doc.track,
      order: doc.order,
      isDeleted: doc.isDeleted,
      createdAt: (doc as any).createdAt?.toISOString?.(),
      updatedAt: (doc as any).updatedAt?.toISOString?.(),
    };
  }

  async list(projectId: string): Promise<VideoResponseDto[]> {
    if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid project');
    const docs = await this.videoModel.find({ projectId: new Types.ObjectId(projectId), isDeleted: false }).sort({ order: 1, createdAt: 1 }).exec();
    return docs.map((d) => this.toDto(d));
  }

  async get(projectId: string, id: string): Promise<VideoResponseDto> {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    const doc = await this.videoModel.findOne({ _id: new Types.ObjectId(id), projectId: new Types.ObjectId(projectId), isDeleted: false }).exec();
    if (!doc) throw new NotFoundException('Video not found');
    return this.toDto(doc);
  }

  async create(projectId: string, dto: UploadUserVideoV2V3RequestDto): Promise<VideoResponseDto> {
    if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid project');
    const doc = new this.videoModel({
      ...dto,
      projectId: new Types.ObjectId(projectId),
      type: 'uploaded',
      track: dto.track || 'V2',
    });
    const saved = await doc.save();
    return this.toDto(saved);
  }

  async update(projectId: string, id: string, dto: UpdateVideoRequestDto): Promise<VideoResponseDto> {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    const updated = await this.videoModel.findOneAndUpdate({ _id: new Types.ObjectId(id), projectId: new Types.ObjectId(projectId) }, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Video not found');
    return this.toDto(updated);
  }

  async remove(projectId: string, id: string): Promise<VideoResponseDto> {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    
    const video = await this.videoModel.findOne({ _id: new Types.ObjectId(id), projectId: new Types.ObjectId(projectId), isDeleted: false }).exec();
    if (!video) throw new NotFoundException('Video not found');

    // 파일 정리 (미러링된 파일인 경우)
    try {
      if (video.videoUrl && video.videoUrl.includes('/uploads/')) {
        await this.storageFactory.deleteFile(video.videoUrl);
        this.logger.log(`비디오 파일 삭제 완료: ${video.videoUrl}`);
      }
    } catch (error) {
      this.logger.warn(`비디오 파일 삭제 실패: ${error.message}`);
    }

    // DB에서 삭제 표시
    const updated = await this.videoModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), projectId: new Types.ObjectId(projectId) }, 
      { isDeleted: true }, 
      { new: true }
          ).exec();

      this.logger.log(`비디오 삭제 완료 - videoId: ${id}, projectId: ${projectId}`);
      return this.toDto(updated!);
  }

  /**
   * 특정 컷에서 생성된 모든 비디오를 정리합니다 (컷 삭제 시 호출)
   */
  async removeBySourceCut(projectId: string, sourceCutId: string): Promise<void> {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(sourceCutId)) {
      this.logger.warn(`유효하지 않은 ID - projectId: ${projectId}, sourceCutId: ${sourceCutId}`);
      return;
    }

    const videos = await this.videoModel.find({
      projectId: new Types.ObjectId(projectId),
      sourceCutId: new Types.ObjectId(sourceCutId),
      isDeleted: false
    }).exec();

    if (videos.length === 0) {
      this.logger.log(`sourceCutId ${sourceCutId}에서 생성된 비디오 없음`);
      return;
    }

    // 각 비디오의 파일 정리 및 DB 삭제
    for (const video of videos) {
      try {
        // 파일 정리 (미러링된 파일인 경우)
        if (video.videoUrl && video.videoUrl.includes('/uploads/')) {
          await this.storageFactory.deleteFile(video.videoUrl);
          this.logger.log(`연관 비디오 파일 삭제: ${video.videoUrl}`);
        }
      } catch (error) {
        this.logger.warn(`연관 비디오 파일 삭제 실패: ${error.message}`);
      }
    }

    // DB에서 일괄 삭제 표시
    const result = await this.videoModel.updateMany(
      {
        projectId: new Types.ObjectId(projectId),
        sourceCutId: new Types.ObjectId(sourceCutId),
        isDeleted: false
      },
      { isDeleted: true }
    ).exec();

    this.logger.log(`컷 ${sourceCutId}에서 생성된 비디오 ${result.modifiedCount}개 정리 완료`);
  }

  /**
   * fal.ai Veo3 Fast I2V를 이용해 컷 이미지를 비디오로 생성하고 Video 도큐먼트를 저장합니다.
   * 참고: `https://fal.ai/models/fal-ai/veo3/fast/image-to-video/api`
   */
  async generateFromCut(projectId: string, dto: any): Promise<VideoResponseDto> {
    const limit = Number(this.configService.get('FAL_MAX_CONCURRENT_PER_PROJECT') || 2);
    return this.withProjectConcurrency(projectId, limit, async () => {
      const { sourceCutId, sceneId, track, prompt } = dto;
      // nullish 병합으로 안전 값 보정
      const resolution: '720p' | '1080p' = dto?.resolution ?? '720p';
      const duration: '8s' = dto?.duration ?? '8s';
      const generate_audio: boolean = dto?.generate_audio ?? true;
      const safeTrack: 'V2' | 'V3' = (track === 'V2' || track === 'V3') ? track : 'V2';

      // 로깅: 요청 메타데이터 (민감정보 제외)
      this.logger.log(`Veo3 생성 요청 시작 - projectId: ${projectId}, sourceCutId: ${sourceCutId}, track: ${safeTrack}, resolution: ${resolution}, duration: ${duration}, generate_audio: ${generate_audio}`);

      if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid project');
      if (!Types.ObjectId.isValid(sourceCutId)) throw new BadRequestException('Invalid sourceCutId');

      // 중복 생성 방지
      const existingVideo = await this.videoModel.findOne({
        projectId: new Types.ObjectId(projectId),
        sourceCutId: new Types.ObjectId(sourceCutId),
        track,
        isDeleted: false
      }).exec();

      if (existingVideo) {
        this.logger.warn(`중복 생성 시도 감지 - projectId: ${projectId}, sourceCutId: ${sourceCutId}, track: ${safeTrack}`);
        throw new BadRequestException(`이미 ${track} 트랙에 생성된 비디오가 있습니다.`);
      }

      // sceneId가 없으면 sourceCutId로부터 조회
      let actualSceneId = sceneId;
      if (!actualSceneId) {
        try {
          actualSceneId = await this.cutService.findSceneIdByCutId(projectId, sourceCutId);
          this.logger.log(`sourceCutId로부터 sceneId 조회: ${actualSceneId}`);
        } catch (error) {
          this.logger.warn(`sceneId 조회 실패: ${error.message}`);
        }
      }

      // DB에서 컷 정보 조회 (sceneId가 있으면 사용)
      let cut: any = null;
      if (actualSceneId) {
        cut = await this.cutService.findById(projectId, actualSceneId, sourceCutId);
      } else {
        cut = await this.cutService.findBySourceCutId(projectId, sourceCutId);
      }
      if (!cut) {
        throw new NotFoundException('Cut not found');
      }
      this.logger.log(`DB에서 컷 정보 조회: ${cut.title}`);

      // 이미지 URL 처리
      let imageUrl: string;
      if (cut.imageUrl) {
        // 컷에 이미지 URL이 있으면 사용
        imageUrl = cut.imageUrl;
        this.logger.log(`컷에서 이미지 URL 가져옴: ${imageUrl}`);
      } else {
        // 컷에 이미지 URL이 없으면 getImage 메서드로 조회
        if (actualSceneId) {
          imageUrl = await this.cutService.getImage(projectId, actualSceneId, sourceCutId);
        } else {
          // sceneId가 없으면 직접 조회
          const cutWithImage = await this.cutService.findBySourceCutId(projectId, sourceCutId);
          imageUrl = cutWithImage.imageUrl || '';
        }
        
        if (!imageUrl) {
          throw new BadRequestException('Cut image URL is required');
        }
        this.logger.log(`getImage로 이미지 URL 조회: ${imageUrl}`);
      }
      
      // 이미지 URL을 fal.ai 스토리지에 업로드하여 안정적인 URL 확보
      if (imageUrl.startsWith('http')) {
        // 이미 공개 URL인 경우 그대로 사용
        this.logger.log(`공개 URL 사용: ${imageUrl}`);
      } else {
        // 로컬 이미지를 fal.ai 스토리지에 업로드
        try {
          this.logger.log(`로컬 이미지를 fal.ai 스토리지에 업로드 시작: ${imageUrl}`);
          
          // 로컬 이미지 URL을 절대 URL로 변환 (백엔드 공개 주소 사용)
          const baseUrl =
            this.configService.get<string>('BACKEND_PUBLIC_URL') ||
            this.configService.get<string>('BACKEND_URL') ||
            this.configService.get<string>('API_BASE_URL') ||
            'http://localhost:5001';
          const fullImageUrl = `${baseUrl}${imageUrl}`;
          
          this.logger.log(`전체 이미지 URL: ${fullImageUrl}`);
          
          // 이미지를 fetch하여 File 객체 생성
          const response = await fetch(fullImageUrl);
          if (!response.ok) {
            throw new Error(`이미지 fetch 실패: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const fileName = `cut_${sourceCutId}_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          // fal.ai 스토리지에 업로드
          const uploadedUrl = await fal.storage.upload(file);
          imageUrl = uploadedUrl;
          
          this.logger.log(`fal.ai 스토리지 업로드 완료: ${imageUrl}`);
        } catch (uploadError) {
          this.logger.warn(`fal.ai 스토리지 업로드 실패, 로컬 URL 사용: ${uploadError.message}`);
          // 업로드 실패 시 절대 URL로 보정
          const baseUrlFallback =
            this.configService.get<string>('BACKEND_PUBLIC_URL') ||
            this.configService.get<string>('BACKEND_URL') ||
            this.configService.get<string>('API_BASE_URL') ||
            'http://localhost:5001';
          imageUrl = `${baseUrlFallback}${imageUrl}`;
        }
      }

      // 로깅: 컷 정보 및 이미지 URL (민감정보 제외)
      this.logger.log(`컷 조회 완료 - cutId: ${sourceCutId}, imageUrl: ${imageUrl.substring(0, 50)}...`);
      this.logger.log(`이미지 URL 전체: ${imageUrl}`);

      const falKey = this.configService.get<string>('FAL_KEY');
      if (!falKey) {
        throw new BadRequestException('FAL_KEY is not configured');
      }

      // 프롬프트 빌더 (Veo 가이드 반영): lighting control, audio control, dialogs, character consistency
      // 참고: https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_Veo.ipynb?hl=ko#scrollTo=2-rXik8CZtHk
      const parts: string[] = [];
      this.logger.log(`프롬프트 빌더 시작 - 컷 제목: ${cut.title}`);

      // Character consistency (컷 메타데이터를 그대로 사용)
      const subjects: any[] = Array.isArray(cut.subjectMovement) ? cut.subjectMovement : [];
      this.logger.log(`캐릭터 정보 - subjects.length: ${subjects.length}, subjects: ${JSON.stringify(subjects)}`);
      if (subjects.length > 0) {
        parts.push('Characters:');
        subjects.slice(0, 6).forEach((s) => {
          const identity = [s?.name, s?.type].filter(Boolean).join(' — ');
          const desc = [s?.position, s?.action, s?.emotion, s?.description].filter(Boolean).join(', ');
          parts.push(`- ${identity}${desc ? `: ${desc}` : ''}`);
        });
        parts.push('Maintain character identity consistency across the clip (clothing, hair, age, facial features).');
        this.logger.log(`캐릭터 정보 추가됨 - parts.length: ${parts.length}`);
      }

      // Dialogs (자막 비삽입, 자연스러운 립싱크 지시)
      this.logger.log(`대화 정보 - dialogue: "${cut.dialogue || '없음'}", narration: "${cut.narration || '없음'}"`);
      if (cut.dialogue && cut.dialogue.trim().length > 0) {
        parts.push(`Dialog: "${cut.dialogue}"`);
        parts.push('Animate natural mouth movement to loosely match the line. Do not add on-screen subtitles.');
        this.logger.log(`대화 정보 추가됨 - parts.length: ${parts.length}`);
      }
      if (cut.narration && cut.narration.trim().length > 0) {
        parts.push(`Narration: "${cut.narration}" (voiceover).`);
        this.logger.log(`내레이션 정보 추가됨 - parts.length: ${parts.length}`);
      }

      // Audio control
      if (generate_audio) {
        const sfx = cut.soundEffects;
        if (sfx && String(sfx).trim().length > 0) {
          parts.push(`Audio: generate ambient soundscape; include cues such as ${sfx}. Avoid loud music unless implied.`);
        } else {
          parts.push('Audio: generate natural ambient soundscape. Avoid loud music unless implied.');
        }
      } else {
        parts.push('Audio: no audio.');
      }

      // Lighting control (specialLighting 그대로 사용)
      const lighting = cut.specialRequirements?.specialLighting;
      if (lighting && typeof lighting === 'object') {
        const enabled = Object.entries(lighting)
          .filter(([, v]) => !!v)
          .map(([k]) => k)
          .join(', ');
        if (enabled) parts.push(`Lighting: ${enabled}.`);
      }

      // Action / Camera motion / Style / Director notes (메타데이터 그대로 사용)
      if (cut.description) parts.push(`Action: ${cut.description}`);
      const camMove = cut.cameraSetup?.cameraMovement;
      if (camMove && camMove !== 'Static') parts.push(`Camera motion: ${camMove}`);
      const styleHints: string[] = [];
      const shotSize = cut.cameraSetup?.shotSize;
      const lensSpecs = cut.cameraSetup?.lensSpecs;
      if (shotSize && shotSize !== 'MS') styleHints.push(`shot size ${shotSize}`);
      if (lensSpecs) styleHints.push(`lens ${lensSpecs}`);
      if (styleHints.length > 0) parts.push(`Style: ${styleHints.join(', ')}`);
      if (cut.directorNotes) parts.push(`Director notes: ${cut.directorNotes}`);

      // Special effects (VFX, SFX 등)
      if (cut.vfxEffects && cut.vfxEffects.trim().length > 0) {
        parts.push(`Visual effects: ${cut.vfxEffects}`);
      }

      // Special requirements (특수 촬영, 특수 효과 등)
      const specialCinematography = cut.specialRequirements?.specialCinematography;
      if (specialCinematography) {
        const enabled = Object.entries(specialCinematography)
          .filter(([, v]) => !!v)
          .map(([k]) => k)
          .join(', ');
        if (enabled) parts.push(`Special cinematography: ${enabled}`);
      }

      const specialEffects = cut.specialRequirements?.specialEffects;
      if (specialEffects) {
        const enabled = Object.entries(specialEffects)
          .filter(([, v]) => !!v)
          .map(([k]) => k)
          .join(', ');
        if (enabled) parts.push(`Special effects: ${enabled}`);
      }

      const defaultPrompt = parts.join('\n');
      this.logger.log(`parts 배열 최종 상태 - length: ${parts.length}, 내용: ${JSON.stringify(parts)}`);
      this.logger.log(`기본 프롬프트 (parts.length: ${parts.length}): ${defaultPrompt}`);
      this.logger.log(`사용자 제공 프롬프트: ${prompt || '없음'}`);
      
      let finalPrompt = (prompt && prompt.trim().length > 0 ? prompt : defaultPrompt);
      this.logger.log(`최종 프롬프트 (사용자/기본): ${finalPrompt}`);
      
      // 프롬프트가 비어있거나 너무 짧으면 기본값 사용
      if (!finalPrompt || finalPrompt.trim().length < 10) {
        finalPrompt = 'Animate the image with natural motion.';
        this.logger.log(`프롬프트가 너무 짧아 기본값으로 대체: ${finalPrompt}`);
      }
      
      // 프롬프트 길이 제한 (fal.ai 제한)
      if (finalPrompt.length > 1000) {
        finalPrompt = finalPrompt.substring(0, 1000);
        this.logger.log(`프롬프트가 너무 길어 잘림: ${finalPrompt.length}자`);
      }

      // 로깅: 생성된 프롬프트 확인
      this.logger.log(`생성된 프롬프트 (${finalPrompt.length}자): ${finalPrompt}`);
      this.logger.log(`프롬프트 타입: ${typeof finalPrompt}, null 여부: ${finalPrompt === null}, undefined 여부: ${finalPrompt === undefined}`);
      this.logger.log(`컷 메타데이터: ${JSON.stringify({
        title: cut.title,
        description: cut.description,
        dialogue: cut.dialogue,
        narration: cut.narration,
        subjectMovement: cut.subjectMovement?.length || 0,
        soundEffects: cut.soundEffects,
        directorNotes: cut.directorNotes
      })}`);
      this.logger.log(`이미지 URL 타입: ${typeof imageUrl}, null 여부: ${imageUrl === null}, undefined 여부: ${imageUrl === undefined}`);
      this.logger.log(`이미지 URL 전체: ${imageUrl}`);

      // fal.ai 클라이언트 설정
      const falApiKey = this.configService.get<string>('FAL_KEY') || process.env.FAL_KEY;
      if (!falApiKey) {
        this.logger.error('FAL_KEY가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
        throw new BadRequestException('FAL_KEY is not configured. Please check environment variables.');
      }
      
      this.logger.log(`FAL_KEY 설정 확인: ${falApiKey ? '설정됨' : '설정되지 않음'}`);
      this.logger.log(`FAL_KEY 길이: ${falApiKey.length}`);
      
      fal.config({
        credentials: falApiKey
      });
      
      this.logger.log('fal.ai 클라이언트 설정 완료');

      // fal.ai Veo3 Fast API - Queue 방식 호출
      const modelId = 'fal-ai/veo3/fast/image-to-video';
      let requestId: string;
      
      try {
        this.logger.log(`fal.ai Veo3 Queue API 요청 시작 - modelId: ${modelId}`);
        
        // Input 값 검증
        if (!finalPrompt || finalPrompt.trim().length === 0) {
          throw new BadRequestException('프롬프트가 비어있습니다.');
        }
        
        if (!imageUrl || imageUrl.trim().length === 0) {
          throw new BadRequestException('이미지 URL이 비어있습니다.');
        }
        
        this.logger.log(`Input 값 검증 완료:`);
        this.logger.log(`- prompt: "${finalPrompt}"`);
        this.logger.log(`- prompt 길이: ${finalPrompt.length}자`);
        this.logger.log(`- image_url: "${imageUrl}"`);
        this.logger.log(`- duration: ${duration}`);
        this.logger.log(`- generate_audio: ${generate_audio}`);
        this.logger.log(`- resolution: ${resolution}`);
        
        // 1. Queue 요청 제출
        const { request_id } = await fal.queue.submit(modelId, {
          input: {
            prompt: finalPrompt,
            image_url: imageUrl,
            duration,
            generate_audio,
            resolution,
          },
        });
        
        requestId = request_id;
        this.logger.log(`Queue 요청 제출 성공 - requestId: ${requestId}`);
        
      } catch (err: any) {
        this.logger.error(`fal.ai Queue API 제출 에러: ${JSON.stringify({
          message: err?.message,
          details: err?.details
        })}`);
        throw new BadRequestException(`Veo 요청 제출에 실패했습니다: ${err?.message || '알 수 없는 오류'}`);
      }

      // 2. Queue 상태 확인 및 결과 대기 (최대 2분)
      let videoUrl: string | undefined;
      const maxWaitTime = 120000; // 2분
      const pollInterval = 3000; // 3초마다 확인
      let elapsedTime = 0;
      
      while (elapsedTime < maxWaitTime) {
        try {
          // 상태 확인
          const status = await fal.queue.status(modelId, {
            requestId: requestId,
            logs: true,
          });
          
          this.logger.log(`Queue 상태 확인: ${JSON.stringify(status)}`);
          
          const statusStr = status.status as string;
          if (statusStr === 'COMPLETED') {
            // 3. 결과 가져오기
            const result = await fal.queue.result(modelId, {
              requestId: requestId
            });
            
            this.logger.log(`Queue 결과: ${JSON.stringify(result.data)}`);
            
            if (result.data?.video?.url) {
              videoUrl = result.data.video.url;
              this.logger.log(`Queue 완료 - videoUrl: ${videoUrl}`);
              break;
            }
          } else if (statusStr === 'FAILED' || statusStr === 'CANCELLED') {
            throw new Error(`Queue 처리 실패: ${JSON.stringify(status)}`);
          }
          
          // 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          elapsedTime += pollInterval;
          
        } catch (error: any) {
          this.logger.warn(`Queue 상태 확인 실패, 재시도: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          elapsedTime += pollInterval;
        }
      }
      
      if (!videoUrl) {
        throw new BadRequestException('Veo 생성이 시간 내 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      }

      // 로깅: fal 결과 수신
      this.logger.log(`fal 결과 수신 완료 - videoUrl: ${videoUrl.substring(0, 50)}...`);

      // (옵션) 결과 URL 미러링: USE_MIRROR=true 이고 S3 사용 시 업로드
      let finalUrl = videoUrl;
      try {
        const useMirror = String(this.configService.get('USE_MIRROR') || '').toLowerCase() === 'true';
        if (useMirror && typeof (this.storageFactory as any).uploadFromUrl === 'function') {
          const fileName = `veo3_${sourceCutId}.mp4`;
          this.logger.log(`미러링 시작 - useMirror: ${useMirror}, fileName: ${fileName}`);
          finalUrl = await this.storageFactory.uploadFromUrl(videoUrl, fileName, 'video/mp4', 'videos');
          this.logger.log(`미러링 완료 - finalUrl: ${finalUrl.substring(0, 50)}...`);
        } else {
          this.logger.log(`미러링 비활성화 - useMirror: ${useMirror}`);
        }
      } catch (error) {
        this.logger.warn(`미러링 실패 - 원본 URL 사용: ${error.message}`);
      }

      const saved = await this.videoModel.create({
        projectId: new Types.ObjectId(projectId),
        sceneId: sceneId ? new Types.ObjectId(sceneId) : undefined,
        sourceCutId: new Types.ObjectId(sourceCutId),
        title: cut.title || 'AI Generated Clip',
        description: cut.description,
        duration: cut.estimatedDuration || 8,
        type: 'ai_generated',
        videoUrl: finalUrl,
        track: safeTrack,
      });

      // 로깅: 최종 결과
      this.logger.log(`Veo3 생성 완료 - videoId: ${saved._id}, track: ${track}, duration: ${saved.duration}s`);

      return this.toDto(saved);
    });
  }

  /**
   * 프로젝트별 동시 요청 제한을 위한 헬퍼 메서드
   */
  private async withProjectConcurrency<T>(
    projectId: string, 
    limit: number, 
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `video_generation:${projectId}`;
    const current = await this.getCurrentConcurrency(key);
    
    if (current >= limit) {
      throw new BadRequestException(`프로젝트당 최대 ${limit}개의 동시 비디오 생성이 가능합니다. 잠시 후 다시 시도해 주세요.`);
    }
    
    try {
      await this.incrementConcurrency(key);
      return await fn();
    } finally {
      await this.decrementConcurrency(key);
    }
  }

  private async getCurrentConcurrency(key: string): Promise<number> {
    // 간단한 메모리 기반 카운터 (실제로는 Redis 사용 권장)
    return (global as any)[key] || 0;
  }

  private async incrementConcurrency(key: string): Promise<void> {
    (global as any)[key] = ((global as any)[key] || 0) + 1;
  }

  private async decrementConcurrency(key: string): Promise<void> {
    (global as any)[key] = Math.max(0, ((global as any)[key] || 0) - 1);
  }
}


