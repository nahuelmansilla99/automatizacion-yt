import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PromptsService } from './prompts.service';
import { Prompt } from './entities/prompt.entity';
import { VideoSummary } from '../summaries/entities/video-summary.entity';

describe('PromptsService', () => {
  let service: PromptsService;
  let mockPromptsRepo: any;
  let mockSummariesRepo: any;
  let mockQueryBuilder: any;

  const mockPrompt: Prompt = {
    id: 'prompt-1',
    name: 'Default Prompt',
    content: 'Default system instruction',
    tags: ['youtube', 'general'],
    isDefault: true,
    isActive: true,
    usageCount: 10,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[mockPrompt], 1]),
    };

    mockPromptsRepo = {
      create: vi.fn().mockImplementation((dto) => ({ id: 'prompt-1', ...dto })),
      save: vi
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ id: entity.id || 'prompt-1', ...entity }),
        ),
      findOne: vi.fn().mockResolvedValue(mockPrompt),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      remove: vi.fn().mockResolvedValue(mockPrompt),
      increment: vi.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    mockSummariesRepo = {
      findAndCount: vi.fn().mockResolvedValue([[], 0]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptsService,
        {
          provide: getRepositoryToken(Prompt),
          useValue: mockPromptsRepo,
        },
        {
          provide: getRepositoryToken(VideoSummary),
          useValue: mockSummariesRepo,
        },
      ],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a prompt without isDefault: true', async () => {
      const dto = {
        name: 'Custom Prompt',
        content: 'Custom instruction',
        tags: ['custom'],
      };

      const result = await service.create(dto);

      expect(mockPromptsRepo.update).not.toHaveBeenCalled();
      expect(mockPromptsRepo.create).toHaveBeenCalledWith({
        name: 'Custom Prompt',
        content: 'Custom instruction',
        tags: ['custom'],
        isDefault: false,
        isActive: true,
        usageCount: 0,
      });
      expect(mockPromptsRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('prompt-1');
      expect(result.name).toBe('Custom Prompt');
    });

    it('should create a prompt with isDefault: true and clear previous default', async () => {
      const dto = {
        name: 'New Default Prompt',
        content: 'New default instruction',
        isDefault: true,
      };

      const result = await service.create(dto);

      expect(mockPromptsRepo.update).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false },
      );
      expect(mockPromptsRepo.create).toHaveBeenCalledWith({
        name: 'New Default Prompt',
        content: 'New default instruction',
        tags: [],
        isDefault: true,
        isActive: true,
        usageCount: 0,
      });
      expect(mockPromptsRepo.save).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated prompts with default options', async () => {
      const result = await service.findAll({});

      expect(mockPromptsRepo.createQueryBuilder).toHaveBeenCalledWith('prompt');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'prompt.isDefault',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'prompt.createdAt',
        'DESC',
      );
      expect(result).toEqual({
        data: [mockPrompt],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters for search, tag, isActive, and isDefault', async () => {
      const result = await service.findAll({
        search: 'test',
        tag: 'youtube',
        isActive: true,
        isDefault: false,
        page: 2,
        limit: 5,
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        isActive: true,
        isDefault: false,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'prompt.name ILIKE :search',
        { search: '%test%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        ':tag = ANY(prompt.tags)',
        { tag: 'youtube' },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should return a prompt if found', async () => {
      mockPromptsRepo.findOne.mockResolvedValue(mockPrompt);

      const result = await service.findOne('prompt-1');

      expect(mockPromptsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'prompt-1' },
      });
      expect(result).toEqual(mockPrompt);
    });

    it('should throw NotFoundException if prompt is not found', async () => {
      mockPromptsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a prompt without changing isDefault', async () => {
      const existingPrompt = { ...mockPrompt, isDefault: false };
      mockPromptsRepo.findOne.mockResolvedValue(existingPrompt);

      const result = await service.update('prompt-1', {
        name: 'Updated Name',
      });

      expect(mockPromptsRepo.update).not.toHaveBeenCalled();
      expect(mockPromptsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        }),
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should clear previous default when setting isDefault: true on a non-default prompt', async () => {
      const existingPrompt = { ...mockPrompt, isDefault: false };
      mockPromptsRepo.findOne.mockResolvedValue(existingPrompt);

      const result = await service.update('prompt-1', {
        isDefault: true,
      });

      expect(mockPromptsRepo.update).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false },
      );
      expect(mockPromptsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: true,
        }),
      );
      expect(result.isDefault).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove a non-default prompt successfully', async () => {
      const nonDefaultPrompt = { ...mockPrompt, isDefault: false };
      mockPromptsRepo.findOne.mockResolvedValue(nonDefaultPrompt);

      const result = await service.remove('prompt-1');

      expect(mockPromptsRepo.remove).toHaveBeenCalledWith(nonDefaultPrompt);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw BadRequestException if trying to remove default prompt', async () => {
      const defaultPrompt = { ...mockPrompt, isDefault: true };
      mockPromptsRepo.findOne.mockResolvedValue(defaultPrompt);

      await expect(service.remove('prompt-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPromptsRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('should set an active prompt as default and clear previous default', async () => {
      const activePrompt = { ...mockPrompt, isDefault: false, isActive: true };
      mockPromptsRepo.findOne.mockResolvedValue(activePrompt);

      const result = await service.setDefault('prompt-1');

      expect(mockPromptsRepo.update).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false },
      );
      expect(mockPromptsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'prompt-1',
          isDefault: true,
        }),
      );
      expect(result.isDefault).toBe(true);
    });

    it('should throw BadRequestException if prompt is inactive', async () => {
      const inactivePrompt = {
        ...mockPrompt,
        isDefault: false,
        isActive: false,
      };
      mockPromptsRepo.findOne.mockResolvedValue(inactivePrompt);

      await expect(service.setDefault('prompt-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPromptsRepo.update).not.toHaveBeenCalled();
      expect(mockPromptsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getActiveDefault', () => {
    it('should return the active default prompt when available', async () => {
      mockPromptsRepo.findOne.mockResolvedValueOnce(mockPrompt);

      const result = await service.getActiveDefault();

      expect(mockPromptsRepo.findOne).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
      });
      expect(result).toEqual(mockPrompt);
    });

    it('should return fallback active prompt when default is not found', async () => {
      const fallbackPrompt = {
        ...mockPrompt,
        id: 'fallback-1',
        isDefault: false,
        isActive: true,
      };
      mockPromptsRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fallbackPrompt);

      const result = await service.getActiveDefault();

      expect(mockPromptsRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: { isDefault: true, isActive: true },
      });
      expect(mockPromptsRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(fallbackPrompt);
    });

    it('should throw BadRequestException if neither default nor fallback active prompt exists', async () => {
      mockPromptsRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.getActiveDefault()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('incrementUsage', () => {
    it('should increment usageCount by 1', async () => {
      await service.incrementUsage('prompt-1');

      expect(mockPromptsRepo.increment).toHaveBeenCalledWith(
        { id: 'prompt-1' },
        'usageCount',
        1,
      );
    });
  });

  describe('getSummariesByPrompt', () => {
    it('should return paginated summaries for an existing prompt', async () => {
      mockPromptsRepo.findOne.mockResolvedValue(mockPrompt);
      const mockSummaries = [
        {
          id: 'summary-1',
          youtubeUrl: 'https://youtube.com/watch?v=123',
          videoTitle: 'Test Video',
          channelName: 'Channel',
          status: 'SUCCESS',
          createdAt: new Date(),
        },
      ];
      mockSummariesRepo.findAndCount.mockResolvedValue([mockSummaries, 1]);

      const result = await service.getSummariesByPrompt('prompt-1', 1, 10);

      expect(mockPromptsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'prompt-1' },
      });
      expect(mockSummariesRepo.findAndCount).toHaveBeenCalledWith({
        where: { promptId: 'prompt-1' },
        select: {
          id: true,
          youtubeUrl: true,
          videoTitle: true,
          channelName: true,
          status: true,
          createdAt: true,
        },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: mockSummaries,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should throw NotFoundException if prompt does not exist', async () => {
      mockPromptsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getSummariesByPrompt('non-existent', 1, 10),
      ).rejects.toThrow(NotFoundException);
      expect(mockSummariesRepo.findAndCount).not.toHaveBeenCalled();
    });
  });
});
