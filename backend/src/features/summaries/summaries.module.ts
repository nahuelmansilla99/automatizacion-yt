import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { VideoSummary } from './entities/video-summary.entity';
import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { NotificationsModule } from '../notifications/notifications.module';

import { TranscriptionService } from './services/transcription.service';
import { DriveSyncService } from './services/drive-sync.service';
import { GeminiService } from './services/gemini.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoSummary]),
    HttpModule,
    NotificationsModule,
  ],
  controllers: [SummariesController],
  providers: [
    SummariesService,
    TranscriptionService,
    DriveSyncService,
    GeminiService,
  ],
  exports: [
    SummariesService,
    TranscriptionService,
    DriveSyncService,
    GeminiService,
    TypeOrmModule,
  ],
})
export class SummariesModule {}
