import { Module } from '@nestjs/common';
import { CoreHubModule } from '../core-hub/core-hub.module';
import { ProfileModule } from '../users/profile.module';
import { HourRequestsController } from './hour-requests.controller';
import { HourRequestsService } from './hour-requests.service';

@Module({
  imports: [ProfileModule, CoreHubModule],
  controllers: [HourRequestsController],
  providers: [HourRequestsService],
})
export class HourRequestsModule {}
