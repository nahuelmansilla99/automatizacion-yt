import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { VideoSummary, SummaryStatus } from './entities/video-summary.entity';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { QuerySummariesDto } from './dto/query-summaries.dto';
import { SummariesGateway } from '../notifications/summaries.gateway';
import { TranscriptionService } from './services/transcription.service';
import { GeminiService } from './services/gemini.service';
import { DriveSyncService } from './services/drive-sync.service';

@Injectable()
export class SummariesService {
  private readonly logger = new Logger(SummariesService.name);

  constructor(
    @InjectRepository(VideoSummary)
    private readonly summariesRepository: Repository<VideoSummary>,
    private readonly gateway: SummariesGateway,
    private readonly transcriptionService: TranscriptionService,
    private readonly geminiService: GeminiService,
    private readonly driveSyncService: DriveSyncService,
  ) {}

  async create(createSummaryDto: CreateSummaryDto): Promise<VideoSummary> {
    const summary = this.summariesRepository.create({
      youtubeUrl: createSummaryDto.youtubeUrl,
      status: SummaryStatus.PENDING,
    });

    const savedSummary = await this.summariesRepository.save(summary);
    this.gateway.notifySummaryCreated(savedSummary);

    // Disparar procesamiento nativo en segundo plano sin bloquear la respuesta HTTP
    this.executePipeline(savedSummary.id, savedSummary.youtubeUrl).catch(
      (error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Error no capturado en pipeline para el video ${savedSummary.id}: ${err.message}`,
          err.stack,
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

    this.executePipeline(updated.id, updated.youtubeUrl).catch(
      (error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Error no capturado en reintento para el video ${updated.id}: ${err.message}`,
          err.stack,
        );
      },
    );

    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const summary = await this.findOne(id);
    await this.summariesRepository.remove(summary);
    this.gateway.notifySummaryDeleted(id);
    return { deleted: true };
  }

  async syncSummaryToDrive(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const summary = await this.findOne(id);

    if (!summary.markdownContent) {
      throw new BadRequestException(
        'El resumen no cuenta con contenido Markdown generado para sincronizar.',
      );
    }

    const success = await this.driveSyncService.syncToDrive({
      id: summary.id,
      videoTitle: summary.videoTitle || 'Resumen de Video',
      channelName: summary.channelName,
      markdownContent: summary.markdownContent,
      youtubeUrl: summary.youtubeUrl,
    });

    if (!success) {
      return {
        success: false,
        message:
          'No se pudo sincronizar con Google Drive. Verifica que N8N_DRIVE_WEBHOOK_URL esté configurado y que n8n esté activo.',
      };
    }

    return {
      success: true,
      message:
        'Sincronización con Google Drive disparada exitosamente hacia n8n.',
    };
  }

  async executePipeline(id: string, youtubeUrl: string): Promise<void> {
    this.logger.log(
      `Iniciando procesamiento nativo para ID: ${id} (${youtubeUrl})`,
    );

    try {
      let videoTitle = 'Video de YouTube';
      let channelName = 'Canal de YouTube';
      let transcript: string | null = null;

      // 1. Verificar si este registro ya posee transcripción guardada (ej. en reintentos tras fallo de Gemini)
      const currentSummary = await this.summariesRepository.findOne({
        where: { id },
      });

      if (currentSummary?.transcript) {
        this.logger.log(
          `Reutilizando transcripción existente en BD para ID: ${id}. Omitiendo llamada a Supadata.`,
        );
        videoTitle = currentSummary.videoTitle || videoTitle;
        channelName = currentSummary.channelName || channelName;
        transcript = currentSummary.transcript;
      } else {
        // Buscar si ya existe otro registro previo con la misma URL que tenga transcripción
        const existingSummary = await this.summariesRepository.findOne({
          where: { youtubeUrl, status: SummaryStatus.SUCCESS },
          order: { createdAt: 'DESC' },
        });

        if (existingSummary?.transcript) {
          this.logger.log(
            `Reutilizando transcripción de registro previo para ${youtubeUrl}. Omitiendo llamada a Supadata.`,
          );
          videoTitle = existingSummary.videoTitle || videoTitle;
          channelName = existingSummary.channelName || channelName;
          transcript = existingSummary.transcript;

          await this.summariesRepository.update(id, {
            videoTitle,
            channelName,
            transcript,
          });
        }
      }

      // Si aún no tenemos transcripción, consultamos a Supadata
      if (!transcript) {
        this.logger.log(
          `Consultando Supadata para obtener transcripción de ${youtubeUrl}...`,
        );
        const videoData =
          await this.transcriptionService.fetchVideoData(youtubeUrl);
        videoTitle = videoData.videoTitle;
        channelName = videoData.channelName;
        transcript = videoData.transcript;

        // Persistir tempranamente metadata y transcripción en la base de datos
        await this.summariesRepository.update(id, {
          videoTitle,
          channelName,
          transcript,
        });
      }

      // 2. Generar resumen estructurado con Gemini
      const markdownContent = await this.geminiService.generateSummary(
        videoTitle,
        channelName,
        transcript,
      );

      // 3. Persistir resultado exitoso
      const summary = await this.summariesRepository.findOne({ where: { id } });
      if (!summary) {
        this.logger.warn(
          `Resumen con ID ${id} ya no existe tras completar el pipeline.`,
        );
        return;
      }

      summary.videoTitle = videoTitle;
      summary.channelName = channelName;
      summary.transcript = transcript;
      summary.markdownContent = markdownContent;
      summary.status = SummaryStatus.SUCCESS;
      summary.errorMessage = null;

      const saved = await this.summariesRepository.save(summary);
      this.logger.log(`Resumen completado exitosamente para ID: ${id}`);
      this.gateway.notifySummaryUpdated(saved);

      // 4. Sincronización secundaria a Google Drive vía n8n (Fire & Forget, no bloquea al usuario)
      this.driveSyncService
        .syncToDrive({
          id,
          videoTitle,
          channelName,
          markdownContent,
          youtubeUrl,
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          this.logger.warn(
            `Fallo inesperado al sincronizar con Drive para ${id}: ${error.message}`,
          );
        });
    } catch (error: unknown) {
      let errorMsg = 'Error desconocido al procesar el resumen';
      let stack: string | undefined;

      if (error instanceof Error) {
        errorMsg = error.message;
        stack = error.stack;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as {
          response?: { data?: { message?: string } };
          message?: string;
          stack?: string;
        };
        errorMsg =
          errorObj.response?.data?.message ||
          errorObj.message ||
          errorMsg;
        stack = errorObj.stack;
      }

      this.logger.error(
        `Error al procesar el pipeline para el resumen ${id}: ${errorMsg}`,
        stack,
      );

      const summary = await this.summariesRepository.findOne({ where: { id } });
      if (summary) {
        summary.status = SummaryStatus.ERROR;
        summary.errorMessage = errorMsg;
        const updated = await this.summariesRepository.save(summary);
        this.gateway.notifySummaryError(updated);
      }
    }
  }
}
