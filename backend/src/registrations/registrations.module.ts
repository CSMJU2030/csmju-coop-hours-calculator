import { Module } from '@nestjs/common';
import { ProfileModule } from '../users/profile.module';
import { AttendanceController } from './attendance.controller';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [ProfileModule],
  controllers: [RegistrationsController, AttendanceController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
