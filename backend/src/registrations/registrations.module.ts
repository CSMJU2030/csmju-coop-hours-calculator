import { Module } from '@nestjs/common';
import { CoreHubModule } from '../core-hub/core-hub.module';
import { ProfileModule } from '../users/profile.module';
import { AttendanceController } from './attendance.controller';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [ProfileModule, CoreHubModule],
  controllers: [RegistrationsController, AttendanceController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
