import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { DriveSyncService, DriveSyncPayload } from './drive-sync.service';
import { SummariesGateway } from '../../notifications/summaries.gateway';

describe('DriveSyncService', () => {
  let service: DriveSyncService;
  let mockHttpService: { post: ReturnType<typeof vi.fn> };
  let mockConfigService: { get: ReturnType<typeof vi.fn> };
  let mockGateway: { notifyDriveSynced: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockHttpService = {
      post: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn(),
    };

    mockGateway = {
      notifyDriveSynced: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveSyncService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SummariesGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<DriveSyncService>(DriveSyncService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncToDrive', () => {
    const samplePayload: DriveSyncPayload = {
      id: 'test-summary-id-123',
      videoTitle: 'Aprende NestJS en 10 Minutos',
      channelName: 'DevChannel',
      markdownContent: '# Resumen\nContenido de prueba',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    it('should return false and skip POST if N8N_DRIVE_WEBHOOK_URL is not configured (empty or undefined)', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'N8N_DRIVE_WEBHOOK_URL') return '';
        if (key === 'WEBHOOK_SECRET') return 'test-secret';
        return null;
      });

      const debugSpy = vi.spyOn(Logger.prototype, 'debug').mockReturnValue();

      const result = await service.syncToDrive(samplePayload);

      expect(result).toBe(false);
      expect(mockHttpService.post).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(
        'N8N_DRIVE_WEBHOOK_URL no configurada, omitiendo sincronización con Google Drive.',
      );
    });

    it('should return false and skip POST if N8N_DRIVE_WEBHOOK_URL is undefined', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'N8N_DRIVE_WEBHOOK_URL') return undefined;
        if (key === 'WEBHOOK_SECRET') return 'test-secret';
        return null;
      });

      const debugSpy = vi.spyOn(Logger.prototype, 'debug').mockReturnValue();

      const result = await service.syncToDrive(samplePayload);

      expect(result).toBe(false);
      expect(mockHttpService.post).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(
        'N8N_DRIVE_WEBHOOK_URL no configurada, omitiendo sincronización con Google Drive.',
      );
    });

    it('should send POST request with correct payload and headers, and return true on success', async () => {
      const webhookUrl = 'https://n8n.example.com/webhook/drive-sync';
      const webhookSecret = 'my-super-secret-123';

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'N8N_DRIVE_WEBHOOK_URL') return webhookUrl;
        if (key === 'WEBHOOK_SECRET') return webhookSecret;
        return null;
      });

      mockHttpService.post.mockReturnValue(of({ data: { success: true } }));

      const logSpy = vi.spyOn(Logger.prototype, 'log').mockReturnValue();

      const result = await service.syncToDrive(samplePayload);

      expect(result).toBe(true);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        webhookUrl,
        {
          id: samplePayload.id,
          videoTitle: samplePayload.videoTitle,
          channelName: 'DevChannel',
          markdownContent: samplePayload.markdownContent,
          youtubeUrl: samplePayload.youtubeUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhookSecret,
          },
          timeout: 25000,
        },
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Sincronización a Google Drive completada exitosamente hacia n8n para ID: ${samplePayload.id}`,
      );
      expect(mockGateway.notifyDriveSynced).toHaveBeenCalledWith({
        id: samplePayload.id,
        driveFileName: samplePayload.videoTitle,
        driveFileId: undefined,
        driveUrl: undefined,
      });
    });

    it('should fallback channelName to "YouTube" if not provided in payload', async () => {
      const webhookUrl = 'https://n8n.example.com/webhook/drive-sync';
      const webhookSecret = 'my-super-secret-123';

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'N8N_DRIVE_WEBHOOK_URL') return webhookUrl;
        if (key === 'WEBHOOK_SECRET') return webhookSecret;
        return null;
      });

      mockHttpService.post.mockReturnValue(of({ data: { success: true } }));

      const payloadWithoutChannel = {
        id: 'no-channel-id',
        videoTitle: 'Video Sin Canal',
        markdownContent: '# Resumen',
        youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
      };

      const result = await service.syncToDrive(payloadWithoutChannel);

      expect(result).toBe(true);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        webhookUrl,
        expect.objectContaining({
          channelName: 'YouTube',
        }),
        expect.any(Object),
      );
    });

    it('should catch error, log warning, and return false without throwing when webhook fails', async () => {
      const webhookUrl = 'https://n8n.example.com/webhook/drive-sync';
      const webhookSecret = 'my-super-secret-123';

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'N8N_DRIVE_WEBHOOK_URL') return webhookUrl;
        if (key === 'WEBHOOK_SECRET') return webhookSecret;
        return null;
      });

      const errorMessage = 'Network error: ECONNREFUSED';
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockReturnValue();

      let result: boolean | undefined;
      let errorThrown = false;

      try {
        result = await service.syncToDrive(samplePayload);
      } catch {
        errorThrown = true;
      }

      expect(errorThrown).toBe(false);
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        `Fallo en la sincronización con Google Drive (n8n): ${errorMessage}`,
      );
    });
  });
});
