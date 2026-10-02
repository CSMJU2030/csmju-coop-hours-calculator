import { Module } from '@nestjs/common';
import { CoreHubModule } from '../core-hub/core-hub.module';
import { ProfileController } from './profile.controller';
import { StudentsSummaryController } from './students-summary.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [CoreHubModule],
  providers: [ProfileService],
  controllers: [ProfileController, StudentsSummaryController],
  exports: [ProfileService],
})
export class ProfileModule {}
