import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { VideoController } from '../src/video/video.controller';
import { VideoService } from '../src/video/video.service';
import { Video, VideoSchema } from '../src/video/schema/video.schema';
import { Cut, CutSchema } from '../src/cut/schema/cut.schema';
import { StorageFactoryService } from '../src/common/services/storage-factory.service';
import { S3Service } from '../src/common/services/s3.service';
import { LocalStorageService } from '../src/common/services/local-storage.service';

describe('Video Integration Tests', () => {
  let app: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let videoModel: Model<Video>;
  let cutModel: Model<Cut>;

  beforeAll(async () => {
    // MongoDB Memory Server 시작
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();
    mongoConnection = await connect(mongoUri);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      controllers: [VideoController],
      providers: [
        VideoService,
        {
          provide: getModelToken(Video.name),
          useValue: mongoConnection.model(Video.name, VideoSchema),
        },
        {
          provide: getModelToken(Cut.name),
          useValue: mongoConnection.model(Cut.name, CutSchema),
        },
        {
          provide: StorageFactoryService,
          useValue: {
            uploadFromUrl: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {},
        },
        {
          provide: LocalStorageService,
          useValue: {},
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    videoModel = moduleFixture.get<Model<Video>>(getModelToken(Video.name));
    cutModel = moduleFixture.get<Model<Cut>>(getModelToken(Cut.name));
  });

  afterAll(async () => {
    await app.close();
    await mongoConnection.close();
    await mongoMemoryServer.stop();
  });

  beforeEach(async () => {
    // 테스트 데이터 정리
    await videoModel.deleteMany({});
    await cutModel.deleteMany({});
  });

  describe('POST /api/project/:projectId/video/generate', () => {
    const projectId = '507f1f77bcf86cd799439011';
    const sceneId = '507f1f77bcf86cd799439012';
    const sourceCutId = '507f1f77bcf86cd799439013';

    beforeEach(async () => {
      // 테스트용 컷 생성
      const testCut = new cutModel({
        _id: new Types.ObjectId(sourceCutId),
        projectId: new Types.ObjectId(projectId),
        sceneId: new Types.ObjectId(sceneId),
        title: 'Test Cut',
        description: 'A test cut for video generation',
        imageUrl: 'http://example.com/test-image.jpg',
        estimatedDuration: 8,
        subjectMovement: [
          {
            name: 'John',
            type: 'Actor',
            action: 'walking',
            emotion: 'happy',
          },
        ],
        dialogue: 'Hello, world!',
        soundEffects: 'birds chirping',
        specialRequirements: {
          specialLighting: {
            natural: true,
          },
        },
        cameraSetup: {
          cameraMovement: 'slow push-in',
          shotSize: 'medium shot',
          lensSpecs: '50mm',
        },
        directorNotes: 'Keep it natural.',
        isDeleted: false,
      });
      await testCut.save();
    });

    it('should return 400 for invalid project ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/project/invalid-id/video/generate')
        .send({
          sourceCutId,
          sceneId,
          track: 'V2',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid project');
    });

    it('should return 400 for invalid source cut ID', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/project/${projectId}/video/generate`)
        .send({
          sourceCutId: 'invalid-id',
          sceneId,
          track: 'V2',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid sourceCutId');
    });

    it('should return 404 when cut not found', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/project/${projectId}/video/generate`)
        .send({
          sourceCutId: '507f1f77bcf86cd799439099', // 존재하지 않는 ID
          sceneId,
          track: 'V2',
        })
        .expect(404);

      expect(response.body.message).toContain('Source cut not found');
    });

    it('should return 400 when cut has no image', async () => {
      // 이미지가 없는 컷으로 업데이트
      await cutModel.updateOne(
        { _id: new Types.ObjectId(sourceCutId) },
        { imageUrl: null }
      );

      const response = await request(app.getHttpServer())
        .post(`/api/project/${projectId}/video/generate`)
        .send({
          sourceCutId,
          sceneId,
          track: 'V2',
        })
        .expect(400);

      expect(response.body.message).toContain('Cut has no imageUrl');
    });

    it('should return 400 when FAL_KEY is not configured', async () => {
      // FAL_KEY가 없는 환경에서 테스트
      const originalEnv = process.env.FAL_KEY;
      delete process.env.FAL_KEY;

      const response = await request(app.getHttpServer())
        .post(`/api/project/${projectId}/video/generate`)
        .send({
          sourceCutId,
          sceneId,
          track: 'V2',
        })
        .expect(400);

      expect(response.body.message).toContain('FAL_KEY is not configured');

      // 환경변수 복원
      if (originalEnv) {
        process.env.FAL_KEY = originalEnv;
      }
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/project/${projectId}/video/generate`)
        .send({
          // sourceCutId 누락
          sceneId,
          track: 'V2',
        })
        .expect(400);

      expect(response.body.message).toContain('sourceCutId');
    });

    it('should validate track enum values', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/project/${projectId}/video/generate`)
        .send({
          sourceCutId,
          sceneId,
          track: 'INVALID_TRACK', // 유효하지 않은 트랙
        })
        .expect(400);

      expect(response.body.message).toContain('track');
    });
  });

  describe('GET /api/project/:projectId/video', () => {
    const projectId = '507f1f77bcf86cd799439011';

    beforeEach(async () => {
      // 테스트용 비디오 생성
      const testVideos = [
        {
          projectId: new Types.ObjectId(projectId),
          sourceCutId: new Types.ObjectId('507f1f77bcf86cd799439012'),
          title: 'Test Video 1',
          description: 'First test video',
          duration: 8,
          type: 'ai_generated',
          videoUrl: 'http://example.com/video1.mp4',
          track: 'V2',
          order: 1,
          isDeleted: false,
        },
        {
          projectId: new Types.ObjectId(projectId),
          sourceCutId: new Types.ObjectId('507f1f77bcf86cd799439013'),
          title: 'Test Video 2',
          description: 'Second test video',
          duration: 10,
          type: 'ai_generated',
          videoUrl: 'http://example.com/video2.mp4',
          track: 'V3',
          order: 2,
          isDeleted: false,
        },
      ];

      await videoModel.insertMany(testVideos);
    });

    it('should return list of videos for project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/project/${projectId}/video`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Test Video 1');
      expect(response.body[1].title).toBe('Test Video 2');
    });

    it('should return 400 for invalid project ID', async () => {
      await request(app.getHttpServer())
        .get('/api/project/invalid-id/video')
        .expect(400);
    });

    it('should not return deleted videos', async () => {
      // 하나의 비디오를 삭제 표시
      await videoModel.updateOne(
        { title: 'Test Video 1' },
        { isDeleted: true }
      );

      const response = await request(app.getHttpServer())
        .get(`/api/project/${projectId}/video`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Video 2');
    });
  });

  describe('DELETE /api/project/:projectId/video/:id', () => {
    const projectId = '507f1f77bcf86cd799439011';
    const videoId = '507f1f77bcf86cd799439014';

    beforeEach(async () => {
      // 테스트용 비디오 생성
      const testVideo = new videoModel({
        _id: new Types.ObjectId(videoId),
        projectId: new Types.ObjectId(projectId),
        sourceCutId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Test Video for Deletion',
        description: 'Video to be deleted',
        duration: 8,
        type: 'ai_generated',
        videoUrl: '/uploads/videos/test.mp4',
        track: 'V2',
        order: 1,
        isDeleted: false,
      });
      await testVideo.save();
    });

    it('should mark video as deleted', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/project/${projectId}/video/${videoId}`)
        .expect(200);

      expect(response.body.isDeleted).toBe(true);

      // DB에서 확인
      const deletedVideo = await videoModel.findById(videoId);
      expect(deletedVideo.isDeleted).toBe(true);
    });

    it('should return 400 for invalid project ID', async () => {
      await request(app.getHttpServer())
        .delete(`/api/project/invalid-id/video/${videoId}`)
        .expect(400);
    });

    it('should return 400 for invalid video ID', async () => {
      await request(app.getHttpServer())
        .delete(`/api/project/${projectId}/video/invalid-id`)
        .expect(400);
    });

    it('should return 404 when video not found', async () => {
      await request(app.getHttpServer())
        .delete(`/api/project/${projectId}/video/507f1f77bcf86cd799439099`)
        .expect(404);
    });
  });
});
