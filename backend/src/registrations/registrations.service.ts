import { Injectable } from '@nestjs/common';
import {
  ActivityStatus,
  Prisma,
  RegistrationStatus,
} from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { PeopleService } from '../core-hub/people.service';
import { ProfileService, yearLevelFromEntryYear } from '../users/profile.service';
import { CoreHubIdentity } from '../auth/core-hub-identity';

const MAX_WAITLIST_SIZE = 5;

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileService,
    private readonly people: PeopleService,
  ) {}

  async listMine(coreUserId: string) {
    return this.prisma.registration.findMany({
      where: { coreUserId, status: { not: RegistrationStatus.CANCELLED } },
      include: { activity: { select: { title: true, startTime: true } } },
      orderBy: { activity: { startTime: 'desc' } },
    });
  }

  /** นักศึกษาลงทะเบียนตัวเอง — กันชนกันด้วย Serializable transaction + waitlist */
  async register(user: CoreHubIdentity, activityId: string, token: string) {
    await this.profiles.ensure(user, token);

    return this.prisma.$transaction(
      async (tx) => {
        const activity = await tx.activity.findUnique({ where: { id: activityId } });
        if (!activity) throw AppException.notFound('ไม่พบกิจกรรมนี้ในระบบ');
        if (activity.status !== ActivityStatus.OPEN) {
          throw AppException.conflict('กิจกรรมนี้ปิดรับสมัครแล้ว');
        }
        if (new Date() > activity.registrationDeadline) {
          throw AppException.conflict('หมดเขตรับสมัครกิจกรรมนี้แล้ว');
        }

        const existing = await tx.registration.findUnique({
          where: { activityId_coreUserId: { activityId, coreUserId: user.id } },
        });
        if (existing && existing.status !== RegistrationStatus.CANCELLED) {
          throw AppException.conflict('คุณลงทะเบียนกิจกรรมนี้ไว้แล้ว');
        }

        const activeCount = await tx.registration.count({
          where: { activityId, status: RegistrationStatus.REGISTERED },
        });
        const waitingCount = await tx.registration.count({
          where: { activityId, status: RegistrationStatus.WAITING },
        });

        let status: RegistrationStatus;
        let queueNumber: number | null = null;

        if (activeCount < activity.capacity) {
          status = RegistrationStatus.REGISTERED;
        } else if (waitingCount < MAX_WAITLIST_SIZE) {
          status = RegistrationStatus.WAITING;
          queueNumber = waitingCount + 1;
        } else {
          throw AppException.conflict('ที่นั่งและคิวสำรองเต็มแล้ว');
        }

        const data = { status, queueNumber, registeredAt: new Date(), cancelledAt: null };

        return existing
          ? tx.registration.update({ where: { id: existing.id }, data })
          : tx.registration.create({ data: { activityId, coreUserId: user.id, ...data } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** ยกเลิกการลงทะเบียน พร้อมเลื่อนคิวสำรองอัตโนมัติ */
  async cancel(user: CoreHubIdentity, registrationId: string, isStaffOrAdmin: boolean) {
    return this.prisma.$transaction(
      async (tx) => {
        const registration = await tx.registration.findUnique({ where: { id: registrationId } });
        if (!registration) throw AppException.notFound('ไม่พบรายการลงทะเบียนนี้');
        if (!isStaffOrAdmin && registration.coreUserId !== user.id) {
          throw AppException.forbidden('คุณสามารถยกเลิกได้เฉพาะการลงทะเบียนของตนเอง');
        }
        if (
          registration.status !== RegistrationStatus.REGISTERED &&
          registration.status !== RegistrationStatus.WAITING
        ) {
          throw AppException.conflict('ไม่สามารถยกเลิกรายการนี้ได้');
        }

        const wasRegistered = registration.status === RegistrationStatus.REGISTERED;

        await tx.registration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.CANCELLED, queueNumber: null, cancelledAt: new Date() },
        });

        if (wasRegistered) {
          const nextInLine = await tx.registration.findFirst({
            where: { activityId: registration.activityId, status: RegistrationStatus.WAITING, queueNumber: 1 },
          });
          if (nextInLine) {
            await tx.registration.update({
              where: { id: nextInLine.id },
              data: { status: RegistrationStatus.REGISTERED, queueNumber: null },
            });
            const remaining = await tx.registration.findMany({
              where: { activityId: registration.activityId, status: RegistrationStatus.WAITING, queueNumber: { gt: 1 } },
              orderBy: { queueNumber: 'asc' },
            });
            for (const r of remaining) {
              await tx.registration.update({ where: { id: r.id }, data: { queueNumber: (r.queueNumber ?? 1) - 1 } });
            }
          }
        } else {
          const behind = await tx.registration.findMany({
            where: {
              activityId: registration.activityId,
              status: RegistrationStatus.WAITING,
              queueNumber: { gt: registration.queueNumber ?? 0 },
            },
            orderBy: { queueNumber: 'asc' },
          });
          for (const r of behind) {
            await tx.registration.update({ where: { id: r.id }, data: { queueNumber: (r.queueNumber ?? 1) - 1 } });
          }
        }

        return { id: registrationId, deleted: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** รายชื่อสำหรับหน้ายืนยันการเข้าร่วม (อาจารย์) */
  async roster(activityId: string, token: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw AppException.notFound('ไม่พบกิจกรรมนี้ในระบบ');

    const [rows, directory] = await Promise.all([
      this.prisma.registration.findMany({
        where: { activityId, status: { not: RegistrationStatus.CANCELLED } },
        include: { userProfile: { select: { personCode: true } } },
        orderBy: [{ status: 'asc' }, { queueNumber: 'asc' }, { registeredAt: 'asc' }],
      }),
      // ชื่อนักศึกษาดึงจาก Core Hub ด้วย token ของอาจารย์ตอนแสดงผล ไม่ได้เก็บในฐานข้อมูล
      this.people.studentDirectory(token),
    ]);

    const registrations = rows.map((row) => {
      const person = row.userProfile?.personCode ? directory.get(row.userProfile.personCode) : undefined;
      return {
        ...row,
        userProfile: {
          personCode: row.userProfile?.personCode ?? null,
          displayName: person?.fullNameTh ?? null,
          fullName: person?.fullNameTh ?? null,
          major: person?.departmentNameTh ?? null,
          yearLevel: yearLevelFromEntryYear(person?.entryYear ?? null),
        },
      };
    });

    const seated = registrations.filter((r) =>
      ([RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED, RegistrationStatus.ABSENT] as RegistrationStatus[]).includes(
        r.status,
      ),
    );
    const waiting = registrations.filter((r) => r.status === RegistrationStatus.WAITING);

    return { activity, seated, waiting };
  }

  /** อาจารย์ยืนยันการเข้าร่วมแบบชุด — ให้/ถอนชั่วโมงทันที (spec เดิม: ให้ชั่วโมงตอนยืนยัน ไม่ใช่ตอนลงทะเบียน) */
  async confirmAttendance(activityId: string, attendedCoreUserIds: string[]) {
    const attendedSet = new Set(attendedCoreUserIds);

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.activity.findUnique({ where: { id: activityId } });
      if (!activity) throw AppException.notFound('ไม่พบกิจกรรมนี้ในระบบ');

      const seated = await tx.registration.findMany({
        where: {
          activityId,
          status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED, RegistrationStatus.ABSENT] },
        },
      });

      let attended = 0;
      let absent = 0;

      for (const reg of seated) {
        if (attendedSet.has(reg.coreUserId)) {
          await tx.registration.update({
            where: { id: reg.id },
            data: {
              status: RegistrationStatus.ATTENDED,
              attendedAt: new Date(),
              creditedCoopHours: activity.coopHours,
              creditedVolunteerHours: activity.volunteerHours,
              creditedMajorHours: activity.majorHours,
            },
          });
          await tx.userHourSummary.upsert({
            where: { coreUserId: reg.coreUserId },
            create: {
              coreUserId: reg.coreUserId,
              coopHours: activity.coopHours,
              volunteerHours: activity.volunteerHours,
              majorHours: activity.majorHours,
            },
            update: {
              coopHours: { increment: activity.coopHours },
              volunteerHours: { increment: activity.volunteerHours },
              majorHours: { increment: activity.majorHours },
            },
          });
          attended += 1;
        } else {
          if (reg.status === RegistrationStatus.ATTENDED) {
            await tx.userHourSummary.upsert({
              where: { coreUserId: reg.coreUserId },
              create: { coreUserId: reg.coreUserId, coopHours: 0, volunteerHours: 0, majorHours: 0 },
              update: {
                coopHours: { decrement: reg.creditedCoopHours ?? 0 },
                volunteerHours: { decrement: reg.creditedVolunteerHours ?? 0 },
                majorHours: { decrement: reg.creditedMajorHours ?? 0 },
              },
            });
          }
          await tx.registration.update({
            where: { id: reg.id },
            data: {
              status: RegistrationStatus.ABSENT,
              attendedAt: null,
              creditedCoopHours: null,
              creditedVolunteerHours: null,
              creditedMajorHours: null,
            },
          });
          absent += 1;
        }
      }

      return { attended, absent };
    });
  }
}
