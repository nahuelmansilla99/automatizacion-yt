import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { VideoSummary } from '../summaries/entities/video-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt, VideoSummary])],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService, TypeOrmModule],
})
export class PromptsModule {}
