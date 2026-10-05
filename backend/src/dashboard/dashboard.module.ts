import { Module } from '@nestjs/common';
import { HoursModule } from '../hours/hours.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [HoursModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
