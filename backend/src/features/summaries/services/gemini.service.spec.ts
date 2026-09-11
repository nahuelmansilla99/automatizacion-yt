import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiService, GEMINI_SYSTEM_INSTRUCTION } from './gemini.service';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function (this: any) {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('GeminiService', () => {
  let service: GeminiService;

  const mockConfigValues: Record<string, string> = {
    GEMINI_API_KEY: 'test-api-key',
    GEMINI_MODEL: 'gemini-1.5-flash',
  };

  const createServiceWithConfig = async (
    configMap: Record<string, string | undefined>,
  ): Promise<GeminiService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => configMap[key]),
          },
        },
      ],
    }).compile();

    return module.get<GeminiService>(GeminiService);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    service = await createServiceWithConfig(mockConfigValues);
  });

  it('debe estar definido e instanciar GoogleGenAI con la API key', () => {
    expect(service).toBeDefined();
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  describe('generateSummary', () => {
    const videoTitle = 'Introducción a NestJS';
    const channelName = 'Dev Channel';
    const transcript =
      'NestJS es un framework progresivo de Node.js para construir aplicaciones escalables...';

    it('debe generar exitosamente un resumen en Markdown estructurado', async () => {
      const mockMarkdown = `# Introducción a NestJS

> NestJS es un framework robusto para backend que combina TypeScript con principios de arquitectura modular y limpia.

## Puntos Clave y Aprendizajes
- **Modularidad:** Facilita la separación de responsabilidades.
- **Inyección de Dependencias:** Gestión limpia de servicios y repositorios.

## Ideas Principales y Desarrollo
### Arquitectura Modular
NestJS organiza la aplicación en módulos que encapsulan controladores y proveedores.

## Conclusiones / Takeaways
- Ideal para sistemas escalables de nivel empresarial.`;

      mockGenerateContent.mockResolvedValueOnce({
        text: mockMarkdown,
      });

      const result = await service.generateSummary(
        videoTitle,
        channelName,
        transcript,
      );

      expect(result).toBe(mockMarkdown);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-1.5-flash',
          config: {
            systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
          },
        }),
      );

      // Validar que el contenido enviado incluye título, canal y transcripción
      const firstCallArgs = mockGenerateContent.mock.calls[0] as unknown as [
        { contents: string },
      ];
      expect(firstCallArgs[0].contents).toContain(videoTitle);
      expect(firstCallArgs[0].contents).toContain(channelName);
      expect(firstCallArgs[0].contents).toContain(transcript);
    });

    it('debe usar el modelo configurado por defecto si no se especifica GEMINI_MODEL', async () => {
      const defaultService = await createServiceWithConfig({
        GEMINI_API_KEY: 'test-key',
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: '# Resumen con modelo por defecto',
      });

      await defaultService.generateSummary(videoTitle, channelName, transcript);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.6-flash',
        }),
      );
    });

    it('debe usar el modelo personalizado si se especifica GEMINI_MODEL', async () => {
      const customService = await createServiceWithConfig({
        GEMINI_API_KEY: 'test-key',
        GEMINI_MODEL: 'gemini-2.0-flash-exp',
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: '# Resumen con modelo custom',
      });

      await customService.generateSummary(videoTitle, channelName, transcript);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.0-flash-exp',
        }),
      );
    });

    it('debe lanzar un error si GEMINI_API_KEY no está configurada', async () => {
      const serviceWithoutKey = await createServiceWithConfig({
        GEMINI_API_KEY: undefined,
      });

      await expect(
        serviceWithoutKey.generateSummary(videoTitle, channelName, transcript),
      ).rejects.toThrow('GEMINI_API_KEY no está configurada.');

      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('debe lanzar un error si GEMINI_API_KEY está vacía', async () => {
      const serviceWithEmptyKey = await createServiceWithConfig({
        GEMINI_API_KEY: '',
      });

      await expect(
        serviceWithEmptyKey.generateSummary(
          videoTitle,
          channelName,
          transcript,
        ),
      ).rejects.toThrow('GEMINI_API_KEY no está configurada.');

      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('debe lanzar un error si la respuesta del modelo es vacía', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '',
      });

      await expect(
        service.generateSummary(videoTitle, channelName, transcript),
      ).rejects.toThrow('El modelo de Gemini retornó una respuesta vacía.');
    });

    it('debe lanzar un error si la respuesta del modelo contiene solo espacios en blanco', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '   \n\n  \t  ',
      });

      await expect(
        service.generateSummary(videoTitle, channelName, transcript),
      ).rejects.toThrow('El modelo de Gemini retornó una respuesta vacía.');
    });

    it('debe manejar errores de rate limit (429) o cuota excedida de la API de Gemini', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error('429 Resource exhausted: Quota exceeded for quota metric'),
      );

      await expect(
        service.generateSummary(videoTitle, channelName, transcript),
      ).rejects.toThrow(/Cuota excedida o límite de peticiones \(429\)/i);
    });

    it('debe manejar errores de API key inválida de Gemini', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(
          'API_KEY_INVALID: API key not valid. Please pass a valid API key.',
        ),
      );

      await expect(
        service.generateSummary(videoTitle, channelName, transcript),
      ).rejects.toThrow(/Clave de API de Gemini inválida/i);
    });

    it('debe manejar y propagar cualquier otro error de la API con mensaje descriptivo', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error('Network connection timeout'),
      );

      await expect(
        service.generateSummary(videoTitle, channelName, transcript),
      ).rejects.toThrow(
        /Error en la generación de resumen con Gemini: Network connection timeout/,
      );
    });
  });
});
