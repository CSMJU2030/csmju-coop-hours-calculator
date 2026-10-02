import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { ConfirmAttendanceDto } from './dto/confirm-attendance.dto';
import { RegistrationsService } from './registrations.service';

/** /api/v1/activities/:id/attendance — อาจารย์ยืนยันการเข้าร่วมของกิจกรรมหนึ่ง */
@Controller('v1/activities/:id/attendance')
export class AttendanceController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Get()
  @RequirePermissions(Permission.ATTENDANCE_READ_ANY)
  roster(@Param('id', ParseUUIDPipe) id: string, @CoreHubAccessToken() token: string) {
    return this.registrations.roster(id, token);
  }

  @Post()
  @RequirePermissions(Permission.ATTENDANCE_UPDATE_ANY)
  confirm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmAttendanceDto) {
    return this.registrations.confirmAttendance(id, dto.attendedCoreUserIds);
  }
}
