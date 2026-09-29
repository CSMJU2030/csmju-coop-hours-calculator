import { IsUUID } from 'class-validator';

export class CreateRegistrationDto {
  @IsUUID()
  activityId!: string;
}
