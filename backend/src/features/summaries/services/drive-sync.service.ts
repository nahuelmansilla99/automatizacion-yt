import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface DriveSyncPayload {
  id: string;
  videoTitle: string;
  channelName?: string;
  markdownContent: string;
  youtubeUrl: string;
}

@Injectable()
export class DriveSyncService {
  private readonly logger = new Logger(DriveSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async syncToDrive(payload: {
    id: string;
    videoTitle: string;
    channelName?: string;
    markdownContent: string;
    youtubeUrl: string;
  }): Promise<boolean> {
    const n8nDriveWebhookUrl = this.configService.get<string>(
      'N8N_DRIVE_WEBHOOK_URL',
    );
    const webhookSecret = this.configService.get<string>('WEBHOOK_SECRET');

    if (!n8nDriveWebhookUrl || !n8nDriveWebhookUrl.trim()) {
      this.logger.debug(
        'N8N_DRIVE_WEBHOOK_URL no configurada, omitiendo sincronización con Google Drive.',
      );
      return false;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          n8nDriveWebhookUrl,
          {
            id: payload.id,
            videoTitle: payload.videoTitle,
            channelName: payload.channelName || 'YouTube',
            markdownContent: payload.markdownContent,
            youtubeUrl: payload.youtubeUrl,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': webhookSecret,
            },
            timeout: 10000,
          },
        ),
      );

      this.logger.log(
        'Sincronización a Google Drive disparada exitosamente hacia n8n',
      );
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Fallo en la sincronización con Google Drive (n8n): ${errorMessage}`,
      );
      return false;
    }
  }
}
