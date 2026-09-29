import { IsString, MinLength } from 'class-validator';

export class RejectHourRequestDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}
