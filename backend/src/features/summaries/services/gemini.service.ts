import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export const GEMINI_SYSTEM_INSTRUCTION = `Eres un sintetizador de conocimiento experto para Obsidian y sistemas de gestión de conocimiento personal (PKM).
Tu objetivo es transformar la transcripción de un video de YouTube en un resumen analítico, estructurado, claro y de alto valor en formato Markdown para Obsidian.

Instrucciones de formato y estilo:
1. Responde DIRECTAMENTE con el Markdown estructurado. NUNCA agregues introducciones conversacionales, saludos, preámbulos ni despedidas (por ejemplo, PROHIBIDO incluir frases como "¡Hola! Aquí está tu resumen:", "A continuación te presento...", "Espero que te sirva").
2. Estructura obligatoria del Markdown:
   # [Título del Video / Tema Principal]

   > [Resumen Ejecutivo: 2 o 3 párrafos concisos capturando la tesis central, el contexto y el valor fundamental del video]

   ## Puntos Clave y Aprendizajes
   - Lista de viñetas claras donde se destaquen con **negritas** los conceptos, técnicas o términos esenciales.

   ## Ideas Principales y Desarrollo
   - Desglose temático conciso y bien organizado. Utiliza subtítulos de nivel 3 (### Subtema) si la complejidad del contenido lo requiere.

   ## Conclusiones / Takeaways
   - Conclusiones prácticas y aprendizajes accionables para aplicar.

3. Mantén un tono analítico, profesional, conciso y directo.
4. Conserva el idioma del contenido original.`;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey?: string;
  private readonly modelName: string;
  private readonly ai?: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';

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
  ): Promise<string> {
    if (!this.apiKey || !this.ai) {
      const errorMsg = 'GEMINI_API_KEY no está configurada.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const promptContent = `Analiza y sintetiza el siguiente video de YouTube:

**Título:** ${videoTitle}
**Canal:** ${channelName}

**Transcripción:**
${transcript}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: promptContent,
        config: {
          systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
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

      const rawMessage = error instanceof Error ? error.message : String(error);
      const lower = rawMessage.toLowerCase();

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
      }

      const formattedError = `${prefix}: ${rawMessage}`;
      this.logger.error(
        formattedError,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(formattedError);
    }
  }
}
