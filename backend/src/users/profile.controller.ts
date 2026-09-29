import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

/** GET/PATCH /api/v1/me/profile — ข้อมูลธุรกิจของตัวเองในระบบนี้ (ไม่ใช่ตัวตนจาก Core Hub) */
@Controller('v1/me/profile')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  async me(@CurrentUser() user: CoreHubIdentity) {
    return this.profiles.ensure(user);
  }

  @Patch()
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  async update(@CurrentUser() user: CoreHubIdentity, @Body() dto: UpdateProfileDto) {
    await this.profiles.ensure(user);
    return this.profiles.updateOwn(user.id, dto);
  }
}
