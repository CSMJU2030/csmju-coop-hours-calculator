import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { SetActivityStatusDto } from './dto/set-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

/** /api/v1/activities — ประกาศกิจกรรมของหลักสูตร (ทั้งนักศึกษาและอาจารย์อ่านได้) */
@Controller('v1/activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  @RequirePermissions(Permission.ACTIVITY_READ)
  async findAll(@Query() query: QueryActivitiesDto) {
    const { items, total } = await this.activities.findAll(query);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  @Get(':id')
  @RequirePermissions(Permission.ACTIVITY_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activities.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.ACTIVITY_CREATE)
  create(@Body() dto: CreateActivityDto, @CurrentUser() user: CoreHubIdentity) {
    return this.activities.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ACTIVITY_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateActivityDto) {
    return this.activities.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.ACTIVITY_UPDATE)
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetActivityStatusDto) {
    return this.activities.setStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ACTIVITY_DELETE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.activities.remove(id);
  }
}
