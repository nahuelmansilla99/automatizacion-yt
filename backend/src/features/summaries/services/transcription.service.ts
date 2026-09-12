import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface VideoData {
  videoTitle: string;
  channelName: string;
  transcript: string;
}

export interface OEmbedResponse {
  title?: string;
  author_name?: string;
}

export interface SupadataTranscriptItem {
  text: string;
  start?: number;
  duration?: number;
}

export interface SupadataTranscriptResponse {
  content?: string | SupadataTranscriptItem[];
}

function extractHttpErrorDetails(error: unknown): {
  status?: number;
  message: string;
  responseMessage?: string;
  stack?: string;
} {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const response = err.response as Record<string, unknown> | undefined;
    const status =
      typeof response?.status === 'number'
        ? response.status
        : typeof err.status === 'number'
          ? err.status
          : undefined;
    const responseData = response?.data as Record<string, unknown> | undefined;
    const responseMessage =
      typeof responseData?.message === 'string'
        ? responseData.message
        : typeof responseData === 'string'
          ? responseData
          : undefined;
    const message =
      typeof err.message === 'string'
        ? err.message
        : typeof err.error === 'string'
          ? err.error
          : 'Error en la solicitud';
    const stack = typeof err.stack === 'string' ? err.stack : undefined;
    return { status, message, responseMessage, stack };
  }
  return {
    message:
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Error desconocido',
  };
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtiene la metadata (título y autor) de un video de YouTube vía oEmbed
   * y su transcripción vía la API de Supadata.
   */
  async fetchVideoData(youtubeUrl: string): Promise<VideoData> {
    // Paso 1: Metadata vía YouTube oEmbed
    let videoTitle = 'Video de YouTube';
    let channelName = 'Canal de YouTube';

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
      const oembedResponse = await firstValueFrom(
        this.httpService.get<OEmbedResponse>(oembedUrl, { timeout: 7000 }),
      );

      if (oembedResponse?.data) {
        videoTitle = oembedResponse.data.title || 'Video de YouTube';
        channelName = oembedResponse.data.author_name || 'Canal de YouTube';
      }
    } catch (error: unknown) {
      const { status, message } = extractHttpErrorDetails(error);
      if (status === 404 || status === 400) {
        this.logger.error(
          `Error de oEmbed (${status}) para ${youtubeUrl}: URL inválida o video no disponible.`,
        );
        throw new Error('URL de YouTube inválida o video no disponible.');
      }

      this.logger.warn(
        `No se pudo obtener metadata de oEmbed para ${youtubeUrl}: ${message}. Usando valores por defecto.`,
      );
    }

    // Paso 2: Transcripción vía Supadata
    const apiKey = this.configService.get<string>('SUPADATA_API_KEY');
    if (!apiKey) {
      this.logger.error('SUPADATA_API_KEY no configurada en el servidor');
      throw new Error('SUPADATA_API_KEY no configurada en el servidor');
    }

    const supadataUrl = `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true`;
    let data: SupadataTranscriptResponse | undefined;

    try {
      const supadataResponse = await firstValueFrom(
        this.httpService.get<SupadataTranscriptResponse>(supadataUrl, {
          headers: { 'x-api-key': apiKey },
          timeout: 15000,
        }),
      );
      data = supadataResponse?.data;
    } catch (error: unknown) {
      const { status, message, responseMessage, stack } =
        extractHttpErrorDetails(error);
      this.logger.error(
        `Error al consultar Supadata API para ${youtubeUrl}: ${message}`,
        stack,
      );

      if (status === 401) {
        throw new Error('API Key de Supadata inválida o no autorizada.');
      }

      const isQuota =
        status === 402 ||
        (Boolean(responseMessage) &&
          responseMessage!.toLowerCase().includes('quota')) ||
        message.toLowerCase().includes('quota');

      if (isQuota) {
        throw new Error('Cuota de transcripción agotada en Supadata.');
      }

      if (status === 404) {
        throw new Error(
          'No se encontraron subtítulos para este video de YouTube.',
        );
      }

      throw new Error(
        `Error al obtener la transcripción de Supadata: ${message || 'Error desconocido'}`,
      );
    }

    const rawContent = data?.content;
    const transcript: string = Array.isArray(rawContent)
      ? rawContent.map((c) => c.text).join(' ')
      : typeof rawContent === 'string'
        ? rawContent
        : '';

    if (!transcript || transcript.trim().length === 0) {
      this.logger.error(
        `El video no contiene subtítulos o transcripción disponible para ${youtubeUrl}.`,
      );
      throw new Error(
        'El video no contiene subtítulos o transcripción disponible.',
      );
    }

    return {
      videoTitle,
      channelName,
      transcript: transcript.trim(),
    };
  }
}
