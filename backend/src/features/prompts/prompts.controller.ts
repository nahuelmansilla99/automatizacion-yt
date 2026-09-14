import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { QueryPromptsDto } from './dto/query-prompts.dto';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePromptDto) {
    const prompt = await this.promptsService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Prompt creado exitosamente',
      data: prompt,
    };
  }

  @Get()
  async findAll(@Query() query: QueryPromptsDto) {
    return this.promptsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromptDto,
  ) {
    const prompt = await this.promptsService.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Prompt actualizado exitosamente',
      data: prompt,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptsService.remove(id);
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.OK)
  async setDefault(@Param('id', ParseUUIDPipe) id: string) {
    const prompt = await this.promptsService.setDefault(id);
    return {
      statusCode: HttpStatus.OK,
      message: `Prompt "${prompt.name}" establecido como predeterminado`,
      data: prompt,
    };
  }

  @Get(':id/summaries')
  async getSummaries(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.promptsService.getSummariesByPrompt(id, +page, +limit);
  }
}
