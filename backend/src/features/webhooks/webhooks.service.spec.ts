import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { SummaryStatus } from '../summaries/entities/video-summary.entity';
import { SummariesGateway } from '../notifications/summaries.gateway';

const jest = vi;

describe('WebhooksService', () => {
  let service: WebhooksService;
  let mockRepo: any;
  let mockGateway: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'mock-uuid-1234',
        status: SummaryStatus.PENDING,
      }),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
    };

    mockGateway = {
      notifySummaryUpdated: jest.fn(),
      notifySummaryError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: 'VideoSummaryRepository',
          useValue: mockRepo,
        },
        {
          provide: SummariesGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle n8n success and update status to SUCCESS', async () => {
    const result = await service.handleSuccess({
      id: 'mock-uuid-1234',
      videoTitle: 'Test Title',
      channelName: 'Test Channel',
      markdownContent: '# Resumen Test',
    });

    expect(result.status).toBe(SummaryStatus.SUCCESS);
    expect(result.videoTitle).toBe('Test Title');
    expect(result.markdownContent).toBe('# Resumen Test');
    expect(mockGateway.notifySummaryUpdated).toHaveBeenCalled();
  });

  it('should handle n8n error and update status to ERROR', async () => {
    const result = await service.handleError({
      id: 'mock-uuid-1234',
      errorMessage: 'Supadata Timeout',
      failedNode: 'Supadata Node',
    });

    expect(result.status).toBe(SummaryStatus.ERROR);
    expect(result.errorMessage).toContain('Supadata Timeout');
    expect(mockGateway.notifySummaryError).toHaveBeenCalled();
  });
});
