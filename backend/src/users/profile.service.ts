import { Injectable } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ระบบนี้ไม่มีตาราง user ซ้ำกับ Core Hub (data-dictionary.md ข้อ 3) —
 * user_profiles เก็บแค่ข้อมูลธุรกิจของระบบนี้เอง (ชื่อที่แสดง สาขา ชั้นปี)
 * ผูกกับตัวตนจริงด้วย core_user_id (= claim `sub`) เท่านั้น
 *
 * แถวนี้ถูกสร้างแบบ first-touch: ผู้ใช้คนไหนเรียก endpoint ที่ต้อง login
 * เป็นครั้งแรก จะได้แถว user_profiles ว่าง ๆ ของตัวเองทันที
 */
@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async ensure(user: CoreHubIdentity) {
    return this.prisma.userProfile.upsert({
      where: { coreUserId: user.id },
      update: { email: user.email || undefined, coreRole: this.mapCoreRole(user.coreRole) },
      create: {
        coreUserId: user.id,
        email: user.email || undefined,
        coreRole: this.mapCoreRole(user.coreRole),
      },
    });
  }

  private mapCoreRole(role: string): 'student' | 'alumni' | 'staff' | 'admin' {
    const normalized = role.trim().toLowerCase();
    if (normalized === 'alumni' || normalized === 'staff' || normalized === 'admin') {
      return normalized;
    }
    return 'student';
  }

  async updateOwn(
    coreUserId: string,
    data: { studentCode?: string; fullName?: string; displayName?: string; major?: string; yearLevel?: number },
  ) {
    return this.prisma.userProfile.update({ where: { coreUserId }, data });
  }

  async findByCoreUserId(coreUserId: string) {
    return this.prisma.userProfile.findUnique({ where: { coreUserId } });
  }

  /** สรุปรายชื่อนักศึกษาทุกคนพร้อมชั่วโมงสะสม (หน้า admin/students เดิม) */
  async listStudentsSummary() {
    const profiles = await this.prisma.userProfile.findMany({
      where: { coreRole: 'student' },
      include: { summary: true },
      orderBy: { createdAt: 'asc' },
    });

    return profiles.map((p) => {
      const coopHours = p.summary?.coopHours ?? 0;
      return {
        coreUserId: p.coreUserId,
        studentCode: p.studentCode,
        displayName: p.displayName ?? p.fullName,
        major: p.major,
        yearLevel: p.yearLevel,
        coopHours,
        volunteerHours: p.summary?.volunteerHours ?? 0,
        majorHours: p.summary?.majorHours ?? 0,
        eligible: coopHours >= 15,
      };
    });
  }
}
