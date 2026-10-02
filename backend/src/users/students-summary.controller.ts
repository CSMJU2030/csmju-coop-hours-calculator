import { Controller, Get } from '@nestjs/common';
import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { ProfileService } from './profile.service';

/** GET /api/v1/students/summary — สรุปชั่วโมงสะสมของนักศึกษาทุกคน (อาจารย์/เจ้าหน้าที่) */
@Controller('v1/students')
export class StudentsSummaryController {
  constructor(private readonly profiles: ProfileService) {}

  @Get('summary')
  @RequirePermissions(Permission.HOUR_SUMMARY_READ_ANY)
  async summary(@CoreHubAccessToken() token: string) {
    const items = await this.profiles.listStudentsSummary(token);
    return new CollectionResult(items, { total: items.length });
  }
}
