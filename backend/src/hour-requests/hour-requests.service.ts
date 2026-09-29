import { Injectable } from '@nestjs/common';
import { HourRequestCategory, HourRequestStatus } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../users/profile.service';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CreateHourRequestDto } from './dto/create-hour-request.dto';
import { QueryHourRequestsDto } from './dto/query-hour-requests.dto';

function parseCategory(category?: string): HourRequestCategory {
  if (category === 'VOLUNTEER') return HourRequestCategory.VOLUNTEER;
  if (category === 'MAJOR') return HourRequestCategory.MAJOR;
  return HourRequestCategory.COOP;
}

@Injectable()
export class HourRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileService,
  ) {}

  async listMine(coreUserId: string) {
    return this.prisma.hourRequest.findMany({
      where: { coreUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForReview(query: QueryHourRequestsDto) {
    const where = query.status ? { status: query.status as HourRequestStatus } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hourRequest.findMany({
        where,
        include: { userProfile: { select: { displayName: true, fullName: true, studentCode: true } } },
        orderBy: { createdAt: 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.hourRequest.count({ where }),
    ]);
    return { items, total };
  }

  async findOwn(coreUserId: string, id: string) {
    const request = await this.prisma.hourRequest.findUnique({ where: { id } });
    if (!request) throw AppException.notFound('ไม่พบคำร้องนี้ในระบบ');
    if (request.coreUserId !== coreUserId) throw AppException.forbidden('คุณไม่มีสิทธิ์ดูคำร้องนี้');
    return request;
  }

  async create(user: CoreHubIdentity, dto: CreateHourRequestDto) {
    const profile = await this.profiles.ensure(user);
    return this.prisma.hourRequest.create({
      data: {
        coreUserId: user.id,
        studentCode: profile.studentCode ?? undefined,
        studentName: profile.displayName ?? profile.fullName ?? user.email,
        title: dto.title.trim(),
        category: parseCategory(dto.category),
        hours: dto.hours,
        proofUrl: dto.proofUrl || null,
        description: dto.description || null,
        status: HourRequestStatus.PENDING,
      },
    });
  }

  /** นักศึกษาแก้ไขคำร้องที่ถูกปฏิเสธแล้วยื่นใหม่ */
  async resubmit(coreUserId: string, id: string, dto: CreateHourRequestDto) {
    const existing = await this.findOwn(coreUserId, id);
    if (existing.status !== HourRequestStatus.REJECTED) {
      throw AppException.conflict('แก้ไขและยื่นใหม่ได้เฉพาะคำร้องที่ถูกปฏิเสธเท่านั้น');
    }
    return this.prisma.hourRequest.update({
      where: { id },
      data: {
        title: dto.title.trim(),
        category: dto.category ? parseCategory(dto.category) : existing.category,
        hours: dto.hours,
        proofUrl: dto.proofUrl || null,
        description: dto.description || null,
        status: HourRequestStatus.PENDING,
        rejectionReason: null,
      },
    });
  }

  async remove(coreUserId: string, id: string) {
    const existing = await this.findOwn(coreUserId, id);
    if (existing.status === HourRequestStatus.APPROVED) {
      throw AppException.conflict('ลบคำร้องที่อนุมัติแล้วไม่ได้');
    }
    await this.prisma.hourRequest.delete({ where: { id } });
    return { id, deleted: true };
  }

  async approve(reviewer: CoreHubIdentity, id: string) {
    const existing = await this.prisma.hourRequest.findUnique({ where: { id } });
    if (!existing) throw AppException.notFound('ไม่พบคำร้องนี้ในระบบ');
    if (existing.status !== HourRequestStatus.PENDING && existing.status !== HourRequestStatus.PENDING_APPROVAL) {
      throw AppException.conflict('อนุมัติได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
    }
    return this.prisma.hourRequest.update({
      where: { id },
      data: {
        status: HourRequestStatus.APPROVED,
        approvedHours: existing.hours,
        approvedCategory: existing.category,
        statusText: 'อนุมัติแล้ว',
        reviewedBy: reviewer.id,
        rejectionReason: null,
      },
    });
  }

  async reject(reviewer: CoreHubIdentity, id: string, reason: string) {
    const existing = await this.prisma.hourRequest.findUnique({ where: { id } });
    if (!existing) throw AppException.notFound('ไม่พบคำร้องนี้ในระบบ');
    if (existing.status !== HourRequestStatus.PENDING && existing.status !== HourRequestStatus.PENDING_APPROVAL) {
      throw AppException.conflict('ปฏิเสธได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
    }
    return this.prisma.hourRequest.update({
      where: { id },
      data: {
        status: HourRequestStatus.REJECTED,
        statusText: 'ไม่อนุมัติ',
        reviewedBy: reviewer.id,
        rejectionReason: reason.trim(),
      },
    });
  }
}
