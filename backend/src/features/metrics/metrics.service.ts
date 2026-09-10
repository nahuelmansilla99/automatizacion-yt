import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import {
  VideoSummary,
  SummaryStatus,
} from '../summaries/entities/video-summary.entity';

export interface SupadataAccountInfo {
  organizationId: string;
  plan: string;
  maxCredits: number;
  usedCredits: number;
  remainingCredits: number;
  cachedAt: string;
}

export interface AppMetricsResponse {
  supadata: SupadataAccountInfo | null;
  summaries: {
    total: number;
    pending: number;
    success: number;
    error: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private cachedAccountInfo: SupadataAccountInfo | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de caché

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(VideoSummary)
    private readonly summariesRepository: Repository<VideoSummary>,
  ) {}

  async getMetrics(forceRefresh = false): Promise<AppMetricsResponse> {
    const supadataInfo = await this.getSupadataAccountInfo(forceRefresh);

    const [total, pending, success, error] = await Promise.all([
      this.summariesRepository.count(),
      this.summariesRepository.count({
        where: { status: SummaryStatus.PENDING },
      }),
      this.summariesRepository.count({
        where: { status: SummaryStatus.SUCCESS },
      }),
      this.summariesRepository.count({
        where: { status: SummaryStatus.ERROR },
      }),
    ]);

    return {
      supadata: supadataInfo,
      summaries: {
        total,
        pending,
        success,
        error,
      },
    };
  }

  async getSupadataAccountInfo(
    forceRefresh = false,
  ): Promise<SupadataAccountInfo | null> {
    const apiKey = this.configService.get<string>('SUPADATA_API_KEY');

    if (!apiKey) {
      this.logger.debug('SUPADATA_API_KEY no configurada');
      return null;
    }

    const now = Date.now();
    if (
      !forceRefresh &&
      this.cachedAccountInfo &&
      now - this.lastFetchTime < this.CACHE_TTL_MS
    ) {
      return this.cachedAccountInfo;
    }

    try {
      this.logger.log('Consultando cuota de Supadata (GET /v1/me)...');
      const response = await firstValueFrom(
        this.httpService.get('https://api.supadata.ai/v1/me', {
          headers: {
            'x-api-key': apiKey,
          },
          timeout: 7000,
        }),
      );

      const data = response.data;
      const remainingCredits = Math.max(0, data.maxCredits - data.usedCredits);

      this.cachedAccountInfo = {
        organizationId: data.organizationId,
        plan: data.plan,
        maxCredits: data.maxCredits,
        usedCredits: data.usedCredits,
        remainingCredits,
        cachedAt: new Date().toISOString(),
      };
      this.lastFetchTime = now;

      this.logger.log(
        `Cuota de Supadata actualizada: ${data.usedCredits}/${data.maxCredits} créditos usados`,
      );
      return this.cachedAccountInfo;
    } catch (err: any) {
      this.logger.error(
        `Error al consultar cuenta de Supadata: ${err.message}`,
      );
      return this.cachedAccountInfo; // Retorna caché previa si existe
    }
  }
}
