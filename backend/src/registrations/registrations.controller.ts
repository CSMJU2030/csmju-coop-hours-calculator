import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationsService } from './registrations.service';

/** /api/v1/registrations — นักศึกษาลงทะเบียน/ยกเลิกกิจกรรม */
@Controller('v1/registrations')
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Get('me')
  @RequirePermissions(Permission.PARTICIPATION_READ_OWN)
  listMine(@CurrentUser() user: CoreHubIdentity) {
    return this.registrations.listMine(user.id);
  }

  @Post()
  @RequirePermissions(Permission.PARTICIPATION_CREATE_OWN)
  register(@Body() dto: CreateRegistrationDto, @CurrentUser() user: CoreHubIdentity) {
    return this.registrations.register(user, dto.activityId);
  }

  @Delete(':id')
  @RequirePermissions(Permission.PARTICIPATION_DELETE_OWN, Permission.PARTICIPATION_READ_ANY)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CoreHubIdentity) {
    const isStaffOrAdmin = user.subsystemRole === SubsystemRole.STAFF || user.subsystemRole === SubsystemRole.ADMIN;
    return this.registrations.cancel(user, id, isStaffOrAdmin);
  }
}
