import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateHourRequestDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsIn(['COOP', 'VOLUNTEER', 'MAJOR'])
  category?: 'COOP' | 'VOLUNTEER' | 'MAJOR';

  @IsNumber()
  @Min(0.5)
  hours!: number;

  @IsOptional()
  @IsString()
  proofUrl?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;
}
