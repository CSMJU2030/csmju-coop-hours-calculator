import { Injectable } from '@nestjs/common';
import { HourRequestCategory, HourRequestStatus } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { PeopleService } from '../core-hub/people.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../users/profile.service';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { ApproveHourRequestDto } from './dto/approve-hour-request.dto';
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
    private readonly people: PeopleService,
  ) {}

  async listMine(coreUserId: string) {
    return this.prisma.hourRequest.findMany({
      where: { coreUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * คำร้องทั้งหมดสำหรับอาจารย์ — ชื่อนักศึกษาดึงจาก Core Hub ด้วย token ของอาจารย์ตอนแสดงผล
   * (ไม่ได้เก็บในฐานข้อมูล) หาชื่อไม่เจอก็แสดงแค่รหัส หน้ารายการจะไม่พัง
   */
  async listForReview(query: QueryHourRequestsDto, token: string) {
    const where = query.status ? { status: query.status as HourRequestStatus } : {};
    const [[rows, total], directory] = await Promise.all([
      this.prisma.$transaction([
        this.prisma.hourRequest.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // ใหม่สุดอยู่บนสุด (id ช่วยให้เรียงคงที่เมื่อเวลาเท่ากัน)
          skip: query.skip,
          take: query.take,
        }),
        this.prisma.hourRequest.count({ where }),
      ]),
      this.people.studentDirectory(token),
    ]);

    const items = rows.map((row) => {
      const name = row.personCode ? directory.get(row.personCode)?.fullNameTh : undefined;
      return {
        ...row,
        // field ที่หน้าจอเดิมอ่าน — คำนวณตอนตอบ ไม่ได้เก็บ
        studentCode: row.personCode,
        studentName: name ?? row.personCode ?? '',
        userProfile: { displayName: name ?? null, fullName: name ?? null, studentCode: row.personCode },
      };
    });
    return { items, total };
  }

  async findOwn(coreUserId: string, id: string) {
    const request = await this.prisma.hourRequest.findUnique({ where: { id } });
    if (!request) throw AppException.notFound('ไม่พบคำร้องนี้ในระบบ');
    if (request.coreUserId !== coreUserId) throw AppException.forbidden('คุณไม่มีสิทธิ์ดูคำร้องนี้');
    return request;
  }

  async create(user: CoreHubIdentity, dto: CreateHourRequestDto, token: string) {
    const profile = await this.profiles.ensure(user, token);
    return this.prisma.hourRequest.create({
      data: {
        coreUserId: user.id,
        personCode: profile.personCode ?? undefined,
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

  /**
   * อนุมัติ — ใช้ได้กับคำร้องทุกสถานะ: ทั้งอนุมัติครั้งแรก เปลี่ยนจาก "ไม่อนุมัติ" เป็นอนุมัติ
   * และแก้ชั่วโมง/หมวดของคำร้องที่อนุมัติไปแล้ว (อาจารย์กดผิดได้) ยอดสะสมของนักศึกษาคิดจาก
   * approvedHours/approvedCategory ของคำร้องที่อนุมัติ จึงตรงกับผลตรวจล่าสุดเสมอ
   */
  async approve(reviewer: CoreHubIdentity, id: string, dto: ApproveHourRequestDto = {}) {
    const existing = await this.prisma.hourRequest.findUnique({ where: { id } });
    if (!existing) throw AppException.notFound('ไม่พบคำร้องนี้ในระบบ');
    return this.prisma.hourRequest.update({
      where: { id },
      data: {
        status: HourRequestStatus.APPROVED,
        approvedHours: dto.approvedHours ?? existing.hours,
        approvedCategory: dto.approvedCategory ?? existing.category,
        statusText: 'อนุมัติแล้ว',
        reviewedBy: reviewer.id,
        rejectionReason: null,
      },
    });
  }

  /**
   * ไม่อนุมัติ — ใช้ได้กับคำร้องทุกสถานะ รวมถึงที่เคยอนุมัติไปแล้ว: ล้างชั่วโมงและหมวดที่อนุมัติ
   * เพื่อให้ไม่ถูกนับในยอดสะสมอีก
   */
  async reject(reviewer: CoreHubIdentity, id: string, reason: string) {
    const existing = await this.prisma.hourRequest.findUnique({ where: { id } });
    if (!existing) throw AppException.notFound('ไม่พบคำร้องนี้ในระบบ');
    return this.prisma.hourRequest.update({
      where: { id },
      data: {
        status: HourRequestStatus.REJECTED,
        statusText: 'ไม่อนุมัติ',
        reviewedBy: reviewer.id,
        rejectionReason: reason.trim(),
        approvedHours: null,
        approvedCategory: null,
      },
    });
  }
}
