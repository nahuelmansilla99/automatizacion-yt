import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SummariesService } from './summaries.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { QuerySummariesDto } from './dto/query-summaries.dto';

@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() createSummaryDto: CreateSummaryDto) {
    const summary = await this.summariesService.create(createSummaryDto);
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Solicitud de resumen recibida y en procesamiento',
      data: summary,
    };
  }

  @Get()
  async findAll(@Query() query: QuerySummariesDto) {
    return this.summariesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.summariesService.findOne(id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  async retry(@Param('id', ParseUUIDPipe) id: string) {
    const summary = await this.summariesService.retry(id);
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Reintento iniciado exitosamente',
      data: summary,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.summariesService.remove(id);
  }
}
