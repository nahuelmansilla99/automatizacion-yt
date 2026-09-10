import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SummariesService } from './summaries.service';
import { SummaryStatus } from './entities/video-summary.entity';
import { SummariesGateway } from '../notifications/summaries.gateway';

const jest = vi;

describe('SummariesService', () => {
  let service: SummariesService;
  let mockRepo: any;
  let mockGateway: any;
  let mockHttp: any;
  let mockConfig: any;

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
      }),
      remove: jest.fn().mockResolvedValue(true),
    };

    mockGateway = {
      notifySummaryCreated: jest.fn(),
      notifySummaryUpdated: jest.fn(),
      notifySummaryError: jest.fn(),
      notifySummaryDeleted: jest.fn(),
    };

    mockHttp = {
      post: jest.fn(),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue(''),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummariesService,
        {
          provide: 'VideoSummaryRepository',
          useValue: mockRepo,
        },
        {
          provide: HttpService,
          useValue: mockHttp,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: SummariesGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a summary in PENDING status and notify gateway', async () => {
    const result = await service.create({
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

    expect(result.id).toBe('mock-uuid-1234');
    expect(result.status).toBe(SummaryStatus.PENDING);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockGateway.notifySummaryCreated).toHaveBeenCalled();
  });

  it('should find one summary by id', async () => {
    const result = await service.findOne('mock-uuid-1234');
    expect(result.id).toBe('mock-uuid-1234');
  });
});
