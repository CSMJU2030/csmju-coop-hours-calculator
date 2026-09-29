import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { StudentsSummaryController } from './students-summary.controller';
import { ProfileService } from './profile.service';

@Module({
  providers: [ProfileService],
  controllers: [ProfileController, StudentsSummaryController],
  exports: [ProfileService],
})
export class ProfileModule {}
