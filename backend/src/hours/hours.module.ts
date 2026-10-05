import { Module } from '@nestjs/common';
import { HoursService } from './hours.service';

@Module({
  providers: [HoursService],
  exports: [HoursService],
})
export class HoursModule {}
