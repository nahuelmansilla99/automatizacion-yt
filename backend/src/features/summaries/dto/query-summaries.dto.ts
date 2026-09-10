import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { SummaryStatus } from '../entities/video-summary.entity';

export class QuerySummariesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SummaryStatus, {
    message: 'El estado debe ser PENDING, SUCCESS o ERROR',
  })
  status?: SummaryStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
