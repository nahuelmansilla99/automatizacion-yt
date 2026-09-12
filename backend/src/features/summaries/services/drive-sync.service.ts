import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SummariesGateway } from '../../notifications/summaries.gateway';

export interface DriveSyncPayload {
  id: string;
  videoTitle: string;
  channelName?: string | null;
  markdownContent: string;
  youtubeUrl: string;
}

@Injectable()
export class DriveSyncService {
  private readonly logger = new Logger(DriveSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly gateway: SummariesGateway,
  ) {}

  async syncToDrive(payload: DriveSyncPayload): Promise<boolean> {
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
      const response = await firstValueFrom(
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
            timeout: 25000,
          },
        ),
      );

      const resData = response.data;
      const fileName = resData?.driveFileName || payload.videoTitle;
      const fileId = resData?.driveFileId;
      const driveUrl = resData?.driveUrl;

      this.logger.log(
        `Sincronización a Google Drive completada exitosamente hacia n8n para ID: ${payload.id}`,
      );

      this.gateway.notifyDriveSynced({
        id: payload.id,
        driveFileName: fileName,
        driveFileId: fileId,
        driveUrl: driveUrl,
      });

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
