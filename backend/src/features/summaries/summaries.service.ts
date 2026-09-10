import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { VideoSummary, SummaryStatus } from './entities/video-summary.entity';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { QuerySummariesDto } from './dto/query-summaries.dto';
import { SummariesGateway } from '../notifications/summaries.gateway';

@Injectable()
export class SummariesService {
  private readonly logger = new Logger(SummariesService.name);

  constructor(
    @InjectRepository(VideoSummary)
    private readonly summariesRepository: Repository<VideoSummary>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly gateway: SummariesGateway,
  ) {}

  async create(createSummaryDto: CreateSummaryDto): Promise<VideoSummary> {
    const summary = this.summariesRepository.create({
      youtubeUrl: createSummaryDto.youtubeUrl,
      status: SummaryStatus.PENDING,
    });

    const savedSummary = await this.summariesRepository.save(summary);
    this.gateway.notifySummaryCreated(savedSummary);

    // Disparar procesamiento en n8n de manera asíncrona sin bloquear la respuesta HTTP
    this.dispatchToN8n(savedSummary.id, savedSummary.youtubeUrl).catch(
      (error) => {
        this.logger.error(
          `Error al despachar a n8n para el video ${savedSummary.id}: ${error.message}`,
        );
      },
    );

    return savedSummary;
  }

  async findAll(query: QuerySummariesDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (query.status) {
      whereConditions.status = query.status;
    }

    if (query.search) {
      whereConditions.videoTitle = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.summariesRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<VideoSummary> {
    const summary = await this.summariesRepository.findOne({ where: { id } });
    if (!summary) {
      throw new NotFoundException(`Resumen con ID ${id} no encontrado`);
    }
    return summary;
  }

  async retry(id: string): Promise<VideoSummary> {
    const summary = await this.findOne(id);

    summary.status = SummaryStatus.PENDING;
    summary.errorMessage = null;
    const updated = await this.summariesRepository.save(summary);

    this.gateway.notifySummaryUpdated(updated);

    this.dispatchToN8n(updated.id, updated.youtubeUrl).catch((error) => {
      this.logger.error(
        `Error al reintentar n8n para el video ${updated.id}: ${error.message}`,
      );
    });

    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const summary = await this.findOne(id);
    await this.summariesRepository.remove(summary);
    this.gateway.notifySummaryDeleted(id);
    return { deleted: true };
  }

  async dispatchToN8n(id: string, youtubeUrl: string): Promise<void> {
    const n8nWebhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
    const webhookSecret = this.configService.get<string>('WEBHOOK_SECRET');

    if (!n8nWebhookUrl) {
      this.logger.warn(
        'N8N_WEBHOOK_URL no configurada. El registro permanece en PENDING para prueba manual.',
      );
      return;
    }

    try {
      this.logger.log(`Enviando webhook a n8n: ${n8nWebhookUrl} (ID: ${id})`);
      await firstValueFrom(
        this.httpService.post(
          n8nWebhookUrl,
          { id, youtubeUrl },
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
        `Webhook despachado exitosamente a n8n para el ID: ${id}`,
      );
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Fallo de conexión con n8n';
      this.logger.error(`Error al conectar con n8n: ${errorMsg}`);

      // Actualizar a ERROR si n8n no está disponible
      const summary = await this.summariesRepository.findOne({ where: { id } });
      if (summary && summary.status === SummaryStatus.PENDING) {
        summary.status = SummaryStatus.ERROR;
        summary.errorMessage = `Error al contactar n8n: ${errorMsg}`;
        const updated = await this.summariesRepository.save(summary);
        this.gateway.notifySummaryError(updated);
      }
    }
  }
}
