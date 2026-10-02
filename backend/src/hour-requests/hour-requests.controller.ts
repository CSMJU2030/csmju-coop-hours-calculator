import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateHourRequestDto } from './dto/create-hour-request.dto';
import { QueryHourRequestsDto } from './dto/query-hour-requests.dto';
import { RejectHourRequestDto } from './dto/reject-hour-request.dto';
import { HourRequestsService } from './hour-requests.service';

/** /api/v1/hour-requests — คำร้องขอนับชั่วโมงกิจกรรมของนักศึกษา */
@Controller('v1/hour-requests')
export class HourRequestsController {
  constructor(private readonly hourRequests: HourRequestsService) {}

  @Get('me')
  @RequirePermissions(Permission.HOUR_REQUEST_READ_OWN)
  listMine(@CurrentUser() user: CoreHubIdentity) {
    return this.hourRequests.listMine(user.id);
  }

  @Get()
  @RequirePermissions(Permission.HOUR_REQUEST_READ_ANY)
  async listForReview(@Query() query: QueryHourRequestsDto, @CoreHubAccessToken() token: string) {
    const { items, total } = await this.hourRequests.listForReview(query, token);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  @Get(':id')
  @RequirePermissions(Permission.HOUR_REQUEST_READ_OWN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CoreHubIdentity) {
    return this.hourRequests.findOwn(user.id, id);
  }

  @Post()
  @RequirePermissions(Permission.HOUR_REQUEST_CREATE_OWN)
  create(
    @Body() dto: CreateHourRequestDto,
    @CurrentUser() user: CoreHubIdentity,
    @CoreHubAccessToken() token: string,
  ) {
    return this.hourRequests.create(user, dto, token);
  }

  @Patch(':id')
  @RequirePermissions(Permission.HOUR_REQUEST_UPDATE_OWN)
  resubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateHourRequestDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    return this.hourRequests.resubmit(user.id, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.HOUR_REQUEST_DELETE_OWN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CoreHubIdentity) {
    return this.hourRequests.remove(user.id, id);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.HOUR_REQUEST_REVIEW_ANY)
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CoreHubIdentity) {
    return this.hourRequests.approve(user, id);
  }

  @Post(':id/reject')
  @RequirePermissions(Permission.HOUR_REQUEST_REVIEW_ANY)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectHourRequestDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    return this.hourRequests.reject(user, id, dto.reason);
  }
}
