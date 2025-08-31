import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Video, VideoSchema } from './schema/video.schema';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { Cut, CutSchema } from '../cut/schema/cut.schema';
import { S3Service } from '../common/services/s3.service';
import { LocalStorageService } from '../common/services/local-storage.service';
import { StorageFactoryService } from '../common/services/storage-factory.service';
import { CutModule } from '../cut/cut.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: Cut.name, schema: CutSchema },
    ]),
    forwardRef(() => CutModule),
  ],
  controllers: [VideoController],
  providers: [
    VideoService,
    ConfigService,
    // Storage services
    S3Service,
    LocalStorageService,
    StorageFactoryService,
  ],
  exports: [VideoService],
})
export class VideoModule {}


