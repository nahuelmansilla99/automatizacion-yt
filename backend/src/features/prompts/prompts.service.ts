import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Prompt } from './entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { QueryPromptsDto } from './dto/query-prompts.dto';
import { VideoSummary } from '../summaries/entities/video-summary.entity';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    @InjectRepository(Prompt)
    private readonly promptsRepository: Repository<Prompt>,
    @InjectRepository(VideoSummary)
    private readonly summariesRepository: Repository<VideoSummary>,
  ) {}

  async create(dto: CreatePromptDto): Promise<Prompt> {
    // Si se marca como default, desactivar el default anterior
    if (dto.isDefault) {
      await this.clearCurrentDefault();
    }

    const prompt = this.promptsRepository.create({
      name: dto.name,
      content: dto.content,
      tags: dto.tags ?? [],
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
      usageCount: 0,
    });

    const saved = await this.promptsRepository.save(prompt);
    this.logger.log(`Prompt creado: "${saved.name}" (ID: ${saved.id})`);
    return saved;
  }

  async findAll(query: QueryPromptsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Prompt> = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isDefault !== undefined) {
      where.isDefault = query.isDefault;
    }

    let queryBuilder = this.promptsRepository.createQueryBuilder('prompt');

    if (Object.keys(where).length > 0) {
      queryBuilder = queryBuilder.where(where);
    }

    if (query.search) {
      queryBuilder = queryBuilder.andWhere('prompt.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.tag) {
      queryBuilder = queryBuilder.andWhere(':tag = ANY(prompt.tags)', {
        tag: query.tag,
      });
    }

    queryBuilder = queryBuilder
      .orderBy('prompt.isDefault', 'DESC')
      .addOrderBy('prompt.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Prompt> {
    const prompt = await this.promptsRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException(`Prompt con ID "${id}" no encontrado`);
    }
    return prompt;
  }

  async update(id: string, dto: UpdatePromptDto): Promise<Prompt> {
    const prompt = await this.findOne(id);

    // Si se está marcando como default, desactivar el default anterior
    if (dto.isDefault && !prompt.isDefault) {
      await this.clearCurrentDefault();
    }

    Object.assign(prompt, dto);
    const updated = await this.promptsRepository.save(prompt);
    this.logger.log(
      `Prompt actualizado: "${updated.name}" (ID: ${updated.id})`,
    );
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const prompt = await this.findOne(id);

    if (prompt.isDefault) {
      throw new BadRequestException(
        'No se puede eliminar el prompt marcado como predeterminado. Primero asigna otro prompt como predeterminado.',
      );
    }

    await this.promptsRepository.remove(prompt);
    this.logger.log(`Prompt eliminado: "${prompt.name}" (ID: ${id})`);
    return { deleted: true };
  }

  async setDefault(id: string): Promise<Prompt> {
    const prompt = await this.findOne(id);

    if (!prompt.isActive) {
      throw new BadRequestException(
        'No se puede marcar como predeterminado un prompt inactivo.',
      );
    }

    await this.clearCurrentDefault();

    prompt.isDefault = true;
    const updated = await this.promptsRepository.save(prompt);
    this.logger.log(
      `Prompt "${updated.name}" (ID: ${updated.id}) establecido como predeterminado`,
    );
    return updated;
  }

  async getActiveDefault(): Promise<Prompt> {
    const prompt = await this.promptsRepository.findOne({
      where: { isDefault: true, isActive: true },
    });

    if (!prompt) {
      // Fallback: buscar cualquier prompt activo
      const fallback = await this.promptsRepository.findOne({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });

      if (!fallback) {
        throw new BadRequestException(
          'No hay ningún prompt activo configurado en el sistema. Por favor, crea al menos un prompt antes de generar resúmenes.',
        );
      }

      this.logger.warn(
        `No hay prompt predeterminado. Usando fallback: "${fallback.name}" (ID: ${fallback.id})`,
      );
      return fallback;
    }

    return prompt;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.promptsRepository.increment({ id }, 'usageCount', 1);
  }

  async getSummariesByPrompt(id: string, page = 1, limit = 20) {
    await this.findOne(id); // Verifica que el prompt exista

    const skip = (page - 1) * limit;

    const [data, total] = await this.summariesRepository.findAndCount({
      where: { promptId: id },
      select: {
        id: true,
        youtubeUrl: true,
        videoTitle: true,
        channelName: true,
        status: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async clearCurrentDefault(): Promise<void> {
    await this.promptsRepository.update(
      { isDefault: true },
      { isDefault: false },
    );
  }
}
