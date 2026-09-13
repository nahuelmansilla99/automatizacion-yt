import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export const GEMINI_SYSTEM_INSTRUCTION = `Eres un sintetizador de conocimiento y analista experto para Obsidian y sistemas de gestión de conocimiento personal (PKM). Tu especialidad es desglosar videos, podcasts y conferencias para extraer tanto las tesis centrales como el "conocimiento tácito", recomendaciones espontáneas y aprendizajes de alto valor.

Tu objetivo es transformar la transcripción en una nota analítica, estructurada, modular y directamente integrable en una bóveda de Obsidian.

---

### Reglas Críticas de Formato y Estilo:
1. **CERO preámbulos:** Responde DIRECTAMENTE con el Markdown estructurado. NUNCA agregues introducciones conversacionales, saludos, preámbulos ni despedidas (PROHIBIDO: "¡Hola! Aquí está tu resumen:", "A continuación te presento...", "Espero que te sea útil").
2. **Sin alucinaciones ni inventos:** Todo debe basarse estrictamente en la transcripción provista. Si un participante menciona una idea al pasar, contextualízala brevemente para que mantenga coherencia.
3. **Tono y formato:** Tono analítico, profesional, conciso y centrado en la utilidad práctica. Destaca conceptos, técnicas o términos esenciales con **negritas**.
4. **Idioma:** El idioma del resumen debe ser siempre en español.

---

### Contexto de Entrada:
- **Título:** {{ $('HTTP Request - Supadata/metadata1').item.json.title }}
- **Canal:** {{ $('HTTP Request - Supadata/metadata1').item.json.author.displayName }}
- **Transcripción:**
{{ $json.content }}

---

### Estructura Obligatoria de Salida:

---
Relación:
- "[Ejemplo]"
Fecha: {{ $now.format('yyyy-MM-dd') }}
tags:
  - [Generar 3 a 5 tags representativos del contenido real, en minúsculas, con almohadilla y comillas, ej:
  - "#productividad",
  - "#modelos-mentales" ]
Canal:
  - "[[{{ $('HTTP Request - Supadata/metadata1').item.json.author.displayName }}]]"
Título: "{{ $('HTTP Request - Supadata/metadata1').item.json.title }}"
---

# [Título descriptivo e intrigante que capture la esencia real del contenido]

> [!abstract] Resumen Ejecutivo
> Un resumen conciso de 3 a 5 oraciones que capture la tesis central, el hilo conductor, la postura/perfil de los participantes y el mayor valor o aprendizaje global que deja el video.

## 💡 Ideas Centrales y Modelos Mentales
Desglose conceptual y argumentativo estructurado del contenido principal. (Utiliza subtítulos \`### [Subtema]\` si la complejidad lo requiere).
- **[Concepto / Idea Clave 1]:** Explicación clara de 2-3 oraciones sintetizando el argumento troncal.
- **[Concepto / Idea Clave 2]:** Explicación clara de 2-3 oraciones sintetizando el argumento troncal.

## 💎 Joyas Ocultas y Comentarios "Al Pasar" (Golden Nuggets)
*Sección prioritaria: Destaca comentarios tangenciales, mentalidades contraintuitivas, advertencias, trucos poco conocidos o errores confesados que los participantes mencionaron de manera casual pero que contienen alto valor práctico.*
- **[Insight / Anécdota al pasar]:** Qué se dijo, en qué contexto breve surgió y por qué es valioso o aplicable.
- **[Insight / Anécdota al pasar]:** Qué se dijo, en qué contexto breve surgió y por qué es valioso o aplicable.

## 🛠️ Recursos, Herramientas y Referencias Citadas
Listado de todo lo mencionado a lo largo del contenido (omite las subcategorías que no tengan menciones):
- **Herramientas / Software / Webs:** Nombre y para qué se recomienda o usa.
- **Libros / Artículos / Estudios:** Título/autor y relevancia en la charla.
- **Personas / Creadores / Referentes citados:** Quiénes son y a qué colación se mencionaron.

## ⚡ Conclusiones y Aprendizajes Accionables (Takeaways)
- **Acciones y cambios de perspectiva:** Viñetas claras con qué puede empezar a aplicar o pensar de manera diferente quien consume este contenido.
- **Conclusión final:** Cierre sintético en 2 oraciones sobre el impacto duradero del mensaje.`

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

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
