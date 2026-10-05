import { HourRequestStatus, RegistrationStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HoursService } from './hours.service';

interface RequestRow {
  coreUserId: string;
  hours: number;
  approvedHours: number | null;
  category: string;
  approvedCategory: string | null;
}
interface RegistrationRow {
  coreUserId: string;
  activity: { coopHours: number; volunteerHours: number; majorHours: number };
}

/** ฐานข้อมูลปลอม: คืนแถวที่ตั้งไว้ และจดเงื่อนไข where ที่ service ใช้ถาม */
function setup(requests: RequestRow[], registrations: RegistrationRow[]) {
  const hourRequest = { findMany: jest.fn().mockResolvedValue(requests) };
  const registration = { findMany: jest.fn().mockResolvedValue(registrations) };
  const prisma = { hourRequest, registration } as unknown as PrismaService;
  return { service: new HoursService(prisma), hourRequest, registration };
}

const request = (overrides: Partial<RequestRow> = {}): RequestRow => ({
  coreUserId: 'u1',
  hours: 6,
  approvedHours: null,
  category: 'COOP',
  approvedCategory: null,
  ...overrides,
});

const registrationOf = (coop: number, volunteer = 0, major = 0, coreUserId = 'u1'): RegistrationRow => ({
  coreUserId,
  activity: { coopHours: coop, volunteerHours: volunteer, majorHours: major },
});

describe('HoursService (ยอดชั่วโมงสะสมคำนวณสด)', () => {
  it('ไม่มีอะไรเลย = 0 ทุกหมวด', async () => {
    const { service } = setup([], []);
    await expect(service.totalsFor('u1')).resolves.toEqual({ coopHours: 0, volunteerHours: 0, majorHours: 0 });
  });

  it('คำร้องที่อนุมัติ: นับชั่วโมงและหมวดที่อาจารย์อนุมัติ ไม่ใช่ที่นักศึกษาขอ', async () => {
    const { service } = setup(
      [request({ hours: 6, category: 'COOP', approvedHours: 4, approvedCategory: 'VOLUNTEER' })],
      [],
    );

    await expect(service.totalsFor('u1')).resolves.toEqual({ coopHours: 0, volunteerHours: 4, majorHours: 0 });
  });

  it('คำร้องที่ยังไม่มีค่าอนุมัติ ใช้ชั่วโมงและหมวดที่ขอ', async () => {
    const { service } = setup([request({ hours: 3, category: 'MAJOR' })], []);
    await expect(service.totalsFor('u1')).resolves.toEqual({ coopHours: 0, volunteerHours: 0, majorHours: 3 });
  });

  it('ลงทะเบียนได้ที่นั่งแล้ว ได้ชั่วโมงของกิจกรรมนั้นทันที', async () => {
    const { service } = setup([], [registrationOf(4)]);
    await expect(service.totalsFor('u1')).resolves.toEqual({ coopHours: 4, volunteerHours: 0, majorHours: 0 });
  });

  it('รวมคำร้องที่อนุมัติ กับกิจกรรมที่ลงทะเบียน เข้าด้วยกัน', async () => {
    const { service } = setup([request({ hours: 6 })], [registrationOf(4), registrationOf(0, 2)]);
    await expect(service.totalsFor('u1')).resolves.toEqual({ coopHours: 10, volunteerHours: 2, majorHours: 0 });
  });

  it('ถามฐานข้อมูลเฉพาะสิ่งที่ต้องนับ: คำร้องที่อนุมัติ (ไม่ผูกกิจกรรม) และการลงทะเบียนที่ได้ที่นั่ง/มาเข้าร่วม', async () => {
    const { service, hourRequest, registration } = setup([], []);

    await service.totalsFor('u1');

    expect(hourRequest.findMany.mock.calls[0][0].where).toEqual({
      coreUserId: { in: ['u1'] },
      status: HourRequestStatus.APPROVED,
      activityId: null,
    });
    // ยกเลิก (CANCELLED) คิวสำรอง (WAITING) และไม่มา (ABSENT) ไม่อยู่ในรายการนับ → ยกเลิกแล้วชั่วโมงหายทันที
    expect(registration.findMany.mock.calls[0][0].where.status.in).toEqual([
      RegistrationStatus.REGISTERED,
      RegistrationStatus.ATTENDED,
    ]);
  });

  it('คำนวณหลายคนพร้อมกันโดยไม่ปนกัน และคนที่ไม่มีข้อมูลได้ 0', async () => {
    const { service } = setup(
      [request({ coreUserId: 'u1', hours: 6 }), request({ coreUserId: 'u2', hours: 2, category: 'VOLUNTEER' })],
      [registrationOf(4, 0, 0, 'u2')],
    );

    const totals = await service.totalsForMany(['u1', 'u2', 'u3']);

    expect(totals.get('u1')).toEqual({ coopHours: 6, volunteerHours: 0, majorHours: 0 });
    expect(totals.get('u2')).toEqual({ coopHours: 4, volunteerHours: 2, majorHours: 0 });
    expect(totals.get('u3')).toEqual({ coopHours: 0, volunteerHours: 0, majorHours: 0 });
  });

  it('ไม่ปัดเศษผิดเมื่อบวกครึ่งชั่วโมงหลายครั้ง', async () => {
    const { service } = setup([request({ hours: 0.1 }), request({ hours: 0.2 })], []);
    await expect(service.totalsFor('u1')).resolves.toMatchObject({ coopHours: 0.3 });
  });

  it('ไม่ถามฐานข้อมูลเลยถ้าไม่มีผู้ใช้', async () => {
    const { service, hourRequest, registration } = setup([], []);

    const totals = await service.totalsForMany([]);

    expect(totals.size).toBe(0);
    expect(hourRequest.findMany).not.toHaveBeenCalled();
    expect(registration.findMany).not.toHaveBeenCalled();
  });
});
