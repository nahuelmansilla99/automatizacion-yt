import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { VideoSummary } from './entities/video-summary.entity';
import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoSummary]),
    HttpModule,
    NotificationsModule,
  ],
  controllers: [SummariesController],
  providers: [SummariesService],
  exports: [SummariesService, TypeOrmModule],
})
export class SummariesModule {}
