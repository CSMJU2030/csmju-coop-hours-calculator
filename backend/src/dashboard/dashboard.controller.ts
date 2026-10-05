import { Controller, Get } from '@nestjs/common';
import { ActivityStatus } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GET /api/v1/me/dashboard — ข้อมูลรวมของนักศึกษาคนที่ login อยู่: กิจกรรมที่เปิดรับ,
 * คำร้องของตัวเอง, สิ่งที่ลงทะเบียนไว้ (รวมทุกอย่างที่หน้า dashboard เดิมเรียกแยกหลาย
 * endpoint ให้เป็นครั้งเดียว — ลดจำนวน round trip)
 */
@Controller('v1/me/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  async me(@CurrentUser() user: CoreHubIdentity) {
    const [hourRequests, activities, myRegistrations, summary] = await Promise.all([
      this.prisma.hourRequest.findMany({ where: { coreUserId: user.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.activity.findMany({
        where: { status: { in: [ActivityStatus.OPEN, ActivityStatus.PUBLISHED, ActivityStatus.CLOSED] } },
        orderBy: { startTime: 'desc' },
        include: { _count: { select: { registrations: { where: { status: 'REGISTERED' } } } } },
      }),
      this.prisma.registration.findMany({
        where: { coreUserId: user.id, status: { not: 'CANCELLED' } },
        select: { activityId: true },
      }),
      this.prisma.userHourSummary.findUnique({ where: { coreUserId: user.id } }),
    ]);

    return {
      hourRequests,
      activities: activities.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.activityType,
        startTime: a.startTime,
        endTime: a.endTime,
        hours: a.hours,
        coopHours: a.coopHours,
        volunteerHours: a.volunteerHours,
        majorHours: a.majorHours,
        location: a.location,
        capacity: a.capacity,
        registeredCount: a._count.registrations,
        status: a.status,
      })),
      registeredActivityIds: myRegistrations.map((r) => r.activityId),
      summary: {
        coopHours: summary?.coopHours ?? 0,
        volunteerHours: summary?.volunteerHours ?? 0,
        majorHours: summary?.majorHours ?? 0,
      },
    };
  }
}
