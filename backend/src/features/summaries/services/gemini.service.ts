import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey?: string;
  private readonly modelName: string;
  private readonly ai?: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.6-flash';

    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY no está configurada. La síntesis con IA no estará disponible.',
      );
    } else {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  async generateSummary(
    videoTitle: string,
    channelName: string,
    transcript: string,
    youtubeUrl: string,
    systemInstruction: string,
  ): Promise<string> {
    if (!this.apiKey || !this.ai) {
      const errorMsg = 'GEMINI_API_KEY no está configurada.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const promptContent = `Analiza y sintetiza el siguiente video de YouTube:\n\n**Título:** ${videoTitle}\n**Canal:** ${channelName}\n\n**Transcripción:**\n${transcript}`;

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: promptContent,
          config: {
            systemInstruction,
          },
        });

        const markdown = response.text;

        if (!markdown || markdown.trim().length === 0) {
          const emptyErrorMsg =
            'El modelo de Gemini retornó una respuesta vacía.';
          this.logger.error(emptyErrorMsg);
          throw new Error(emptyErrorMsg);
        }

        return markdown;
      } catch (error: any) {
        if (
          error instanceof Error &&
          error.message === 'El modelo de Gemini retornó una respuesta vacía.'
        ) {
          throw error;
        }

        const rawMessage =
          error instanceof Error ? error.message : String(error);
        const lower = rawMessage.toLowerCase();
        const isUnavailable =
          lower.includes('503') ||
          lower.includes('high demand') ||
          lower.includes('unavailable');

        if (isUnavailable && attempt < maxRetries) {
          this.logger.warn(
            `Gemini reportó alta demanda temporal (intento ${attempt}/${maxRetries}). Reintentando en 2 segundos...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        let prefix = 'Error en la generación de resumen con Gemini';
        if (
          lower.includes('429') ||
          lower.includes('quota') ||
          lower.includes('resource_exhausted')
        ) {
          prefix = 'Cuota excedida o límite de peticiones (429) en Gemini';
        } else if (
          lower.includes('api_key_invalid') ||
          lower.includes('invalid api key') ||
          lower.includes('api key not valid')
        ) {
          prefix = 'Clave de API de Gemini inválida';
        } else if (isUnavailable) {
          prefix = 'Servicio de Gemini temporalmente no disponible (503)';
        }

        const formattedError = `${prefix}: ${rawMessage}`;
        this.logger.error(
          formattedError,
          error instanceof Error ? error.stack : undefined,
        );
        throw new Error(formattedError);
      }
    }

    throw new Error('Error inesperado al contactar Gemini.');
  }
}
