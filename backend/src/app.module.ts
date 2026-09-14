import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './core/config/env.validation';
import { DatabaseModule } from './core/database/database.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { SummariesModule } from './features/summaries/summaries.module';
import { WebhooksModule } from './features/webhooks/webhooks.module';
import { MetricsModule } from './features/metrics/metrics.module';
import { PromptsModule } from './features/prompts/prompts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    NotificationsModule,
    SummariesModule,
    WebhooksModule,
    MetricsModule,
    PromptsModule,
  ],
})
export class AppModule {}
