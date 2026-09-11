import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SummariesService } from './summaries.service';
import { SummaryStatus } from './entities/video-summary.entity';
import { SummariesGateway } from '../notifications/summaries.gateway';
import { TranscriptionService } from './services/transcription.service';
import { GeminiService } from './services/gemini.service';
import { DriveSyncService } from './services/drive-sync.service';

const jest = vi;

describe('SummariesService', () => {
  let service: SummariesService;
  let mockRepo: any;
  let mockGateway: any;
  let mockTranscriptionService: any;
  let mockGeminiService: any;
  let mockDriveSyncService: any;

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
    });
    expect(mockGeminiService.generateSummary).toHaveBeenCalledWith(
      'Test Title',
      'Test Channel',
      'This is a sample video transcript.',
    );
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-uuid-1234',
        status: SummaryStatus.SUCCESS,
        markdownContent: '# Resumen\n\nContenido en markdown',
        errorMessage: null,
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
});
