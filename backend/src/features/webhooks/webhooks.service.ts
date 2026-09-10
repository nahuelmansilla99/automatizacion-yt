import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VideoSummary,
  SummaryStatus,
} from '../summaries/entities/video-summary.entity';
import { N8nSuccessWebhookDto } from './dto/n8n-success-webhook.dto';
import { N8nErrorWebhookDto } from './dto/n8n-error-webhook.dto';
import { SummariesGateway } from '../notifications/summaries.gateway';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(VideoSummary)
    private readonly summariesRepository: Repository<VideoSummary>,
    private readonly gateway: SummariesGateway,
  ) {}

  async handleSuccess(dto: N8nSuccessWebhookDto): Promise<VideoSummary> {
    const summary = await this.summariesRepository.findOne({
      where: { id: dto.id },
    });

    if (!summary) {
      this.logger.error(`Resumen no encontrado para el webhook de éxito: ${dto.id}`);
      throw new NotFoundException(`Resumen con ID ${dto.id} no encontrado`);
    }

    // Mapeo flexible de campos
    const resolvedTitle = dto.videoTitle || dto.title || summary.videoTitle;
    const resolvedChannel = dto.channelName || dto.channel || summary.channelName;
    const resolvedMarkdown =
      dto.markdownContent || dto.markdown || dto.text || summary.markdownContent;

    summary.videoTitle = resolvedTitle;
    summary.channelName = resolvedChannel;
    summary.markdownContent = resolvedMarkdown;
    summary.status = SummaryStatus.SUCCESS;
    summary.errorMessage = null;

    const saved = await this.summariesRepository.save(summary);
    this.logger.log(`Resumen completado con éxito para ID: ${saved.id}`);

    this.gateway.notifySummaryUpdated(saved);

    return saved;
  }

  async handleError(dto: N8nErrorWebhookDto): Promise<VideoSummary> {
    const summary = await this.summariesRepository.findOne({
      where: { id: dto.id },
    });

    if (!summary) {
      this.logger.error(`Resumen no encontrado para el webhook de error: ${dto.id}`);
      throw new NotFoundException(`Resumen con ID ${dto.id} no encontrado`);
    }

    const resolvedError =
      dto.errorMessage || dto.message || 'Error no especificado en n8n';
    const nodeInfo = dto.failedNode ? ` (Nodo: ${dto.failedNode})` : '';

    summary.status = SummaryStatus.ERROR;
    summary.errorMessage = `${resolvedError}${nodeInfo}`;

    const saved = await this.summariesRepository.save(summary);
    this.logger.warn(`Resumen marcado con error para ID: ${saved.id} - ${saved.errorMessage}`);

    this.gateway.notifySummaryError(saved);

    return saved;
  }
}
