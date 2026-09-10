import { Module } from '@nestjs/common';
import { SummariesGateway } from './summaries.gateway';

@Module({
  providers: [SummariesGateway],
  exports: [SummariesGateway],
})
export class NotificationsModule {}
