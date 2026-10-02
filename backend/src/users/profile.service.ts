import { Injectable } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { PeopleService } from '../core-hub/people.service';
import { PrismaService } from '../prisma/prisma.service';

/** ชั้นปีจากปีที่เข้าศึกษา (พ.ศ.) — ปีการศึกษาใหม่เริ่มราวเดือนมิถุนายน */
export function yearLevelFromEntryYear(entryYear: number | null, now = new Date()): number | null {
  if (entryYear === null) return null;
  const buddhistYear = now.getFullYear() + 543;
  const academicYear = now.getMonth() >= 5 ? buddhistYear : buddhistYear - 1;
  const level = academicYear - entryYear + 1;
  return level >= 1 ? level : null;
}

/**
 * ระบบนี้ไม่มีตาราง user ซ้ำกับ Core Hub (data-dictionary.md ข้อ 3) —
 * user_profiles ผูกกับตัวตนจริงด้วย core_user_id (= claim sub) และเก็บ person_code เท่านั้น
 * ชื่อ อีเมล สาขา ชั้นปี ห้ามเก็บ (reference-data.md ข้อ 8) — ดึงจาก Core Hub ตอนแสดงผล
 *
 * แถวนี้ถูกสร้างแบบ first-touch: ผู้ใช้คนไหนเรียก endpoint ที่ต้อง login
 * เป็นครั้งแรก จะได้แถว user_profiles ของตัวเองทันที
 */
@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  /**
   * สร้างหรืออัปเดตแถวของผู้ใช้ — ถ้ายังไม่มี person_code และมี token ให้ถาม Core Hub (/people/me)
   * ถามไม่ได้ (บัญชีไม่ผูกกับบุคคล · Core Hub ล่ม) ก็ไม่ทำให้คำขอล้ม แค่เว้น person_code ไว้ก่อน
   */
  async ensure(user: CoreHubIdentity, token?: string) {
    const profile = await this.prisma.userProfile.upsert({
      where: { coreUserId: user.id },
      update: { coreRole: this.mapCoreRole(user.coreRole) },
      create: { coreUserId: user.id, coreRole: this.mapCoreRole(user.coreRole) },
    });

    if (profile.personCode || !token) {
      return profile;
    }

    const person = await this.people.me(token).catch(() => null);
    if (!person) {
      return profile;
    }
    return this.prisma.userProfile.update({
      where: { coreUserId: user.id },
      data: { personCode: person.personCode },
    });
  }

  private mapCoreRole(role: string): 'student' | 'alumni' | 'staff' | 'admin' {
    const normalized = role.trim().toLowerCase();
    if (normalized === 'alumni' || normalized === 'staff' || normalized === 'admin') {
      return normalized;
    }
    return 'student';
  }

  /** โปรไฟล์ของตัวเอง: ชื่อมาจาก Core Hub สด ๆ ไม่ได้มาจากฐานข้อมูลของเรา */
  async mine(user: CoreHubIdentity, token: string) {
    const profile = await this.ensure(user, token);
    const person = await this.people.me(token).catch(() => null);
    return {
      coreUserId: profile.coreUserId,
      coreRole: profile.coreRole,
      personCode: profile.personCode ?? person?.personCode ?? null,
      displayName: person?.fullNameTh ?? null,
    };
  }

  async findByCoreUserId(coreUserId: string) {
    return this.prisma.userProfile.findUnique({ where: { coreUserId } });
  }

  /** สรุปรายชื่อนักศึกษาทุกคนพร้อมชั่วโมงสะสม (หน้า admin/students) — ชื่อดึงจาก Core Hub ด้วย token ของอาจารย์ */
  async listStudentsSummary(token: string) {
    const [profiles, directory] = await Promise.all([
      this.prisma.userProfile.findMany({
        where: { coreRole: 'student' },
        include: { summary: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.people.studentDirectory(token),
    ]);

    return profiles.map((p) => {
      const person = p.personCode ? directory.get(p.personCode) : undefined;
      const coopHours = p.summary?.coopHours ?? 0;
      return {
        coreUserId: p.coreUserId,
        studentCode: p.personCode,
        displayName: person?.fullNameTh ?? null,
        major: person?.departmentNameTh ?? null,
        yearLevel: yearLevelFromEntryYear(person?.entryYear ?? null),
        coopHours,
        volunteerHours: p.summary?.volunteerHours ?? 0,
        majorHours: p.summary?.majorHours ?? 0,
        eligible: coopHours >= 15,
      };
    });
  }
}
