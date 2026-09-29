import { IsIn } from 'class-validator';

export class SetActivityStatusDto {
  @IsIn(['OPEN', 'PUBLISHED', 'CLOSED', 'COMPLETED'])
  status!: 'OPEN' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED';
}
