import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { IsIn, IsOptional } from 'class-validator';

export class QueryActivitiesDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['OPEN', 'PUBLISHED', 'CLOSED', 'COMPLETED'])
  status?: 'OPEN' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED';
}
