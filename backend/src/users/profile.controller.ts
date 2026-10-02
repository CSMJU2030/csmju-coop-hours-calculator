import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { ProfileService } from './profile.service';

/**
 * GET /api/v1/me/profile — ผู้ใช้ที่ login อยู่ในระบบนี้: id · role · person_code · ชื่อที่แสดง
 * ชื่อมาจาก Core Hub (/people/me) ทุกครั้ง ไม่มีการเก็บหรือแก้ชื่อในระบบนี้ จึงไม่มี PATCH
 */
@Controller('v1/me/profile')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  async me(@CurrentUser() user: CoreHubIdentity, @CoreHubAccessToken() token: string) {
    return this.profiles.mine(user, token);
  }
}
