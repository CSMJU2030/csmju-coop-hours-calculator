import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsDateString()
  registrationDeadline!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  @MaxLength(200)
  lecturerInCharge!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coopHours: number = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volunteerHours: number = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  majorHours: number = 0;
}
