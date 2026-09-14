import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SummariesService } from './summaries.service';
import { SummaryStatus } from './entities/video-summary.entity';
import { SummariesGateway } from '../notifications/summaries.gateway';
import { TranscriptionService } from './services/transcription.service';
import { GeminiService } from './services/gemini.service';
import { DriveSyncService } from './services/drive-sync.service';
import { PromptsService } from '../prompts/prompts.service';

const jest = vi;

describe('SummariesService', () => {
  let service: SummariesService;
  let mockRepo: any;
  let mockGateway: any;
  let mockTranscriptionService: any;
  let mockGeminiService: any;
  let mockDriveSyncService: any;
  let mockPromptsService: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((summary) =>
          Promise.resolve({ id: 'mock-uuid-1234', ...summary }),
        ),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue({
        id: 'mock-uuid-1234',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: SummaryStatus.PENDING,
        videoTitle: null,
        channelName: null,
        markdownContent: null,
        errorMessage: null,
        promptId: null,
        promptSnapshot: null,
      }),
      update: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
    };

    mockGateway = {
      notifySummaryCreated: jest.fn(),
      notifySummaryUpdated: jest.fn(),
      notifySummaryError: jest.fn(),
      notifySummaryDeleted: jest.fn(),
    };

    mockTranscriptionService = {
      fetchVideoData: jest.fn().mockResolvedValue({
        videoTitle: 'Test Title',
        channelName: 'Test Channel',
        transcript: 'This is a sample video transcript.',
      }),
    };

    mockGeminiService = {
      generateSummary: jest
        .fn()
        .mockResolvedValue('# Resumen\n\nContenido en markdown'),
    };

    mockDriveSyncService = {
      syncToDrive: jest.fn().mockResolvedValue(true),
    };

    mockPromptsService = {
      getActiveDefault: vi.fn().mockResolvedValue({
        id: 'prompt-uuid-1',
        name: 'Default Prompt',
        content: 'System instruction text',
      }),
      findOne: vi.fn().mockResolvedValue({
        id: 'prompt-uuid-1',
        name: 'Default Prompt',
        content: 'System instruction text',
      }),
      incrementUsage: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummariesService,
        {
          provide: 'VideoSummaryRepository',
          useValue: mockRepo,
        },
        {
          provide: SummariesGateway,
          useValue: mockGateway,
        },
        {
          provide: TranscriptionService,
          useValue: mockTranscriptionService,
        },
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
        {
          provide: DriveSyncService,
          useValue: mockDriveSyncService,
        },
        {
          provide: PromptsService,
          useValue: mockPromptsService,
        },
      ],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a summary in PENDING status and notify gateway', async () => {
    const spyExecute = vi
      .spyOn(service, 'executePipeline')
      .mockImplementation(async () => {});

    const result = await service.create({
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

    expect(result.id).toBe('mock-uuid-1234');
    expect(result.status).toBe(SummaryStatus.PENDING);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockGateway.notifySummaryCreated).toHaveBeenCalled();
    expect(spyExecute).toHaveBeenCalledWith(
      'mock-uuid-1234',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      undefined,
    );
  });

  it('should execute pipeline successfully to SUCCESS and call drive sync', async () => {
    await service.executePipeline(
      'mock-uuid-1234',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );

    expect(mockTranscriptionService.fetchVideoData).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(mockRepo.update).toHaveBeenCalledWith('mock-uuid-1234', {
      videoTitle: 'Test Title',
      channelName: 'Test Channel',
      transcript: 'This is a sample video transcript.',
    });
    expect(mockGeminiService.generateSummary).toHaveBeenCalledWith(
      'Test Title',
      'Test Channel',
      'This is a sample video transcript.',
      'System instruction text',
    );
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-uuid-1234',
        status: SummaryStatus.SUCCESS,
        transcript: 'This is a sample video transcript.',
        markdownContent: '# Resumen\n\nContenido en markdown',
        errorMessage: null,
        promptId: 'prompt-uuid-1',
        promptSnapshot: 'System instruction text',
      }),
    );
    expect(mockGateway.notifySummaryUpdated).toHaveBeenCalled();
    expect(mockDriveSyncService.syncToDrive).toHaveBeenCalledWith({
      id: 'mock-uuid-1234',
      videoTitle: 'Test Title',
      channelName: 'Test Channel',
      markdownContent: '# Resumen\n\nContenido en markdown',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('should reuse existing transcript on retry without calling Supadata', async () => {
    mockRepo.findOne.mockResolvedValueOnce({
      id: 'mock-uuid-1234',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: SummaryStatus.PENDING,
      videoTitle: 'Cached Title',
      channelName: 'Cached Channel',
      transcript: 'Already saved transcript from previous attempt',
      markdownContent: null,
      errorMessage: null,
      promptId: null,
      promptSnapshot: null,
    });

    await service.executePipeline(
      'mock-uuid-1234',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );

    // No debe haber llamado a Supadata
    expect(mockTranscriptionService.fetchVideoData).not.toHaveBeenCalled();

    // Debe llamar a Gemini con la transcripción existente
    expect(mockGeminiService.generateSummary).toHaveBeenCalledWith(
      'Cached Title',
      'Cached Channel',
      'Already saved transcript from previous attempt',
      'System instruction text',
    );
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-uuid-1234',
        status: SummaryStatus.SUCCESS,
        transcript: 'Already saved transcript from previous attempt',
      }),
    );
  });

  it('should handle pipeline errors, set status to ERROR, and notify gateway', async () => {
    mockTranscriptionService.fetchVideoData.mockRejectedValue(
      new Error('El video no contiene subtítulos o transcripción disponible.'),
    );

    await service.executePipeline(
      'mock-uuid-1234',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-uuid-1234',
        status: SummaryStatus.ERROR,
        errorMessage:
          'El video no contiene subtítulos o transcripción disponible.',
      }),
    );
    expect(mockGateway.notifySummaryError).toHaveBeenCalled();
  });

  it('should retry a summary and trigger executePipeline', async () => {
    const spyExecute = vi
      .spyOn(service, 'executePipeline')
      .mockImplementation(async () => {});

    const result = await service.retry('mock-uuid-1234');

    expect(result.status).toBe(SummaryStatus.PENDING);
    expect(result.errorMessage).toBeNull();
    expect(mockGateway.notifySummaryUpdated).toHaveBeenCalled();
    expect(spyExecute).toHaveBeenCalledWith(
      'mock-uuid-1234',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      undefined,
    );
  });

  it('should find one summary by id', async () => {
    const result = await service.findOne('mock-uuid-1234');
    expect(result.id).toBe('mock-uuid-1234');
  });

  it('should remove a summary and notify gateway', async () => {
    const result = await service.remove('mock-uuid-1234');
    expect(result.deleted).toBe(true);
    expect(mockGateway.notifySummaryDeleted).toHaveBeenCalledWith(
      'mock-uuid-1234',
    );
  });

  describe('syncSummaryToDrive', () => {
    it('should throw BadRequestException if summary has no markdownContent', async () => {
      mockRepo.findOne.mockResolvedValueOnce({
        id: 'mock-uuid-1234',
        videoTitle: 'Test Video',
        markdownContent: null,
      });

      await expect(
        service.syncSummaryToDrive('mock-uuid-1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call driveSyncService.syncToDrive and return success when sync succeeds', async () => {
      mockRepo.findOne.mockResolvedValueOnce({
        id: 'mock-uuid-1234',
        videoTitle: 'Video de Prueba',
        channelName: 'Canal Dev',
        markdownContent: '# Resumen válido',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
      mockDriveSyncService.syncToDrive.mockResolvedValueOnce(true);

      const result = await service.syncSummaryToDrive('mock-uuid-1234');

      expect(mockDriveSyncService.syncToDrive).toHaveBeenCalledWith({
        id: 'mock-uuid-1234',
        videoTitle: 'Video de Prueba',
        channelName: 'Canal Dev',
        markdownContent: '# Resumen válido',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('exitosamente');
    });

    it('should return success false and descriptive message when driveSyncService fails', async () => {
      mockRepo.findOne.mockResolvedValueOnce({
        id: 'mock-uuid-1234',
        videoTitle: 'Video de Prueba',
        channelName: 'Canal Dev',
        markdownContent: '# Resumen válido',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
      mockDriveSyncService.syncToDrive.mockResolvedValueOnce(false);

      const result = await service.syncSummaryToDrive('mock-uuid-1234');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No se pudo sincronizar');
    });
  });
});
