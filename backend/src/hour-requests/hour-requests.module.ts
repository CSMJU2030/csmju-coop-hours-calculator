import { Module } from '@nestjs/common';
import { ProfileModule } from '../users/profile.module';
import { HourRequestsController } from './hour-requests.controller';
import { HourRequestsService } from './hour-requests.service';

@Module({
  imports: [ProfileModule],
  controllers: [HourRequestsController],
  providers: [HourRequestsService],
})
export class HourRequestsModule {}
