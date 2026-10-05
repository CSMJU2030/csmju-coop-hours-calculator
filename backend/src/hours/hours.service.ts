import { Injectable } from '@nestjs/common';
import { HourRequestStatus, RegistrationStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface HourTotals {
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
}

/** ลงทะเบียนได้ที่นั่งแล้ว (หรือมาเข้าร่วมแล้ว) ถือว่าได้ชั่วโมงทันที — ยกเลิก/คิวสำรอง/ขาด ไม่นับ */
const COUNTED_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
];

const zero = (): HourTotals => ({ coopHours: 0, volunteerHours: 0, majorHours: 0 });
const round2 = (value: number): number => Math.round(value * 100) / 100;

function add(totals: HourTotals, category: string, hours: number): void {
  if (category === 'VOLUNTEER') totals.volunteerHours += hours;
  else if (category === 'MAJOR') totals.majorHours += hours;
  else totals.coopHours += hours;
}

/**
 * ยอดชั่วโมงสะสมของนักศึกษา — คำนวณสดจากข้อมูลจริงทุกครั้ง ไม่เก็บตัวนับแยก
 * จึงตรงกับสถานะล่าสุดเสมอ ไม่เพี้ยนและไม่นับซ้ำเมื่อมีการยกเลิกหรืออาจารย์แก้ผลตรวจ
 *
 *  - คำร้องที่อนุมัติ: นับ approvedHours ในหมวด approvedCategory (ไม่มีก็ใช้ค่าที่ขอ)
 *  - กิจกรรมของหลักสูตรที่ลงทะเบียนได้ที่นั่ง: นับชั่วโมงของกิจกรรมนั้นทันที ยกเลิกแล้วหายทันที
 *
 * คำร้องที่ผูกกับกิจกรรม (activityId) ถูกข้าม เพราะชั่วโมงของกิจกรรมนับจากการลงทะเบียนอยู่แล้ว
 */
@Injectable()
export class HoursService {
  constructor(private readonly prisma: PrismaService) {}

  async totalsFor(coreUserId: string): Promise<HourTotals> {
    const all = await this.totalsForMany([coreUserId]);
    return all.get(coreUserId) ?? zero();
  }

  async totalsForMany(coreUserIds: string[]): Promise<Map<string, HourTotals>> {
    const totals = new Map<string, HourTotals>(coreUserIds.map((id) => [id, zero()]));
    if (coreUserIds.length === 0) return totals;

    const [requests, registrations] = await Promise.all([
      this.prisma.hourRequest.findMany({
        where: { coreUserId: { in: coreUserIds }, status: HourRequestStatus.APPROVED, activityId: null },
        select: { coreUserId: true, hours: true, approvedHours: true, category: true, approvedCategory: true },
      }),
      this.prisma.registration.findMany({
        where: { coreUserId: { in: coreUserIds }, status: { in: COUNTED_REGISTRATION_STATUSES } },
        select: {
          coreUserId: true,
          activity: { select: { coopHours: true, volunteerHours: true, majorHours: true } },
        },
      }),
    ]);

    for (const request of requests) {
      const target = totals.get(request.coreUserId);
      if (!target) continue;
      add(target, String(request.approvedCategory ?? request.category).toUpperCase(), request.approvedHours ?? request.hours);
    }

    for (const registration of registrations) {
      const target = totals.get(registration.coreUserId);
      if (!target) continue;
      target.coopHours += registration.activity.coopHours;
      target.volunteerHours += registration.activity.volunteerHours;
      target.majorHours += registration.activity.majorHours;
    }

    for (const value of totals.values()) {
      value.coopHours = round2(value.coopHours);
      value.volunteerHours = round2(value.volunteerHours);
      value.majorHours = round2(value.majorHours);
    }
    return totals;
  }
}
