import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryHourRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'])
  status?: string;
}
