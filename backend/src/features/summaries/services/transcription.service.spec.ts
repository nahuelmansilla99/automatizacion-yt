import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TranscriptionService } from './transcription.service';

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let mockHttpService: {
    get: ReturnType<typeof vi.fn>;
  };
  let mockConfigService: {
    get: ReturnType<typeof vi.fn>;
  };

  const sampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  beforeEach(async () => {
    mockHttpService = {
      get: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'SUPADATA_API_KEY') return 'test-supadata-key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchVideoData - a) Obtención exitosa', () => {
    it('debería retornar metadata y transcript cuando Supadata devuelve texto string', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: {
              title: 'Never Gonna Give You Up',
              author_name: 'Rick Astley',
            },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return of({
            data: {
              content: 'Never gonna give you up, never gonna let you down',
            },
          } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown URL'));
      });

      const result = await service.fetchVideoData(sampleUrl);

      expect(result).toEqual({
        videoTitle: 'Never Gonna Give You Up',
        channelName: 'Rick Astley',
        transcript: 'Never gonna give you up, never gonna let you down',
      });
      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
    });

    it('debería concatenar chunks correctamente si Supadata devuelve content como array', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: {
              title: 'TypeScript Tutorial',
              author_name: 'Code Channel',
            },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return of({
            data: {
              content: [
                { text: 'Bienvenido al tutorial', start: 0, duration: 2 },
                { text: 'de TypeScript.', start: 2, duration: 1.5 },
              ],
            },
          } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown URL'));
      });

      const result = await service.fetchVideoData(sampleUrl);

      expect(result).toEqual({
        videoTitle: 'TypeScript Tutorial',
        channelName: 'Code Channel',
        transcript: 'Bienvenido al tutorial de TypeScript.',
      });
    });

    it('debería usar valores por defecto si oEmbed falla con un error no fatal (ej. 500)', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return throwError(() => ({
            response: { status: 500, data: 'Internal Server Error' },
          }));
        }
        if (url.includes('api.supadata.ai')) {
          return of({
            data: {
              content: 'Transcripción válida a pesar del fallo en oEmbed',
            },
          } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown URL'));
      });

      const result = await service.fetchVideoData(sampleUrl);

      expect(result).toEqual({
        videoTitle: 'Video de YouTube',
        channelName: 'Canal de YouTube',
        transcript: 'Transcripción válida a pesar del fallo en oEmbed',
      });
    });
  });

  describe('fetchVideoData - b) Fallo cuando falta SUPADATA_API_KEY', () => {
    it('debería lanzar un error si SUPADATA_API_KEY no está configurada', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: {
              title: 'Video Title',
              author_name: 'Author',
            },
          } as AxiosResponse);
        }
        return of({ data: {} } as AxiosResponse);
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'SUPADATA_API_KEY no configurada en el servidor',
      );
    });

    it('debería lanzar un error si SUPADATA_API_KEY es un string vacío', async () => {
      mockConfigService.get.mockReturnValue('');

      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: {
              title: 'Video Title',
              author_name: 'Author',
            },
          } as AxiosResponse);
        }
        return of({ data: {} } as AxiosResponse);
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'SUPADATA_API_KEY no configurada en el servidor',
      );
    });
  });

  describe('fetchVideoData - c) Fallo cuando no hay subtítulos o transcript vacío', () => {
    it('debería lanzar un error si content es un string vacío', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return of({ data: { content: '' } } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'El video no contiene subtítulos o transcripción disponible.',
      );
    });

    it('debería lanzar un error si content contiene sólo espacios en blanco', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return of({ data: { content: '    ' } } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'El video no contiene subtítulos o transcripción disponible.',
      );
    });

    it('debería lanzar un error si content es un array vacío', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return of({ data: { content: [] } } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'El video no contiene subtítulos o transcripción disponible.',
      );
    });

    it('debería lanzar un error si data.content es undefined/null', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return of({ data: {} } as AxiosResponse);
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'El video no contiene subtítulos o transcripción disponible.',
      );
    });
  });

  describe('fetchVideoData - d) Fallo cuando Supadata retorna errores HTTP', () => {
    it('debería lanzar error específico si Supadata retorna 401 (no autorizado)', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return throwError(() => ({
            response: { status: 401, data: { message: 'Unauthorized' } },
          }));
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'API Key de Supadata inválida o no autorizada.',
      );
    });

    it('debería lanzar error específico si Supadata retorna 402 (cuota agotada)', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return throwError(() => ({
            response: { status: 402, data: { message: 'Payment Required' } },
          }));
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'Cuota de transcripción agotada en Supadata.',
      );
    });

    it('debería lanzar error de cuota si el mensaje de respuesta menciona quota', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return throwError(() => ({
            response: {
              status: 429,
              data: { message: 'Quota exceeded for monthly plan' },
            },
          }));
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'Cuota de transcripción agotada en Supadata.',
      );
    });

    it('debería lanzar error específico si Supadata retorna 404 (no encontrado)', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return of({
            data: { title: 'Title', author_name: 'Author' },
          } as AxiosResponse);
        }
        if (url.includes('api.supadata.ai')) {
          return throwError(() => ({
            response: {
              status: 404,
              data: { message: 'Transcript not found' },
            },
          }));
        }
        return throwError(() => new Error('Unknown'));
      });

      await expect(service.fetchVideoData(sampleUrl)).rejects.toThrow(
        'No se encontraron subtítulos para este video de YouTube.',
      );
    });
  });

  describe('fetchVideoData - Manejo de URL inválida en oEmbed', () => {
    it('debería lanzar error si oEmbed retorna 404 o 400 (video o URL inválida)', async () => {
      mockHttpService.get.mockImplementation((url: string) => {
        if (url.includes('youtube.com/oembed')) {
          return throwError(() => ({
            response: { status: 404, data: 'Not Found' },
          }));
        }
        return of({ data: {} } as AxiosResponse);
      });

      await expect(
        service.fetchVideoData('https://youtube.com/invalid-video'),
      ).rejects.toThrow('URL de YouTube inválida o video no disponible.');
    });
  });
});
