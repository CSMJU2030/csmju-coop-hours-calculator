import { HourRequestCategory, HourRequestStatus } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { PeopleService } from '../core-hub/people.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../users/profile.service';
import { HourRequestsService } from './hour-requests.service';

const reviewer: CoreHubIdentity = {
  id: 'teacher-1',
  email: 't@example.test',
  coreRole: 'staff',
  subsystemRole: SubsystemRole.STAFF,
};

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req-1',
    coreUserId: 'student-1',
    status: HourRequestStatus.PENDING,
    hours: 6,
    category: HourRequestCategory.COOP,
    approvedHours: null,
    approvedCategory: null,
    rejectionReason: null,
    ...overrides,
  };
}

/** ฐานข้อมูลปลอมในหน่วยความจำ: findUnique คืนแถวเดิม update รวมค่าที่แก้เข้าไป */
function setup(row: ReturnType<typeof makeRequest> | null) {
  const hourRequest = {
    findUnique: jest.fn().mockResolvedValue(row),
    update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...row,
      ...data,
    })),
  };
  const prisma = { hourRequest } as unknown as PrismaService;
  const service = new HourRequestsService(prisma, {} as ProfileService, {} as PeopleService);
  return { service, hourRequest };
}

describe('HourRequestsService review (approve / reject)', () => {
  describe('approve()', () => {
    it('คำร้องที่รอตรวจ: อนุมัติตามชั่วโมงและหมวดที่นักศึกษาขอ ถ้าอาจารย์ไม่ปรับ', async () => {
      const { service, hourRequest } = setup(makeRequest());

      await service.approve(reviewer, 'req-1');

      expect(hourRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: expect.objectContaining({
          status: HourRequestStatus.APPROVED,
          approvedHours: 6,
          approvedCategory: HourRequestCategory.COOP,
          reviewedBy: 'teacher-1',
          rejectionReason: null,
        }),
      });
    });

    it('บันทึกชั่วโมงและหมวดที่อาจารย์ปรับ (ไม่ทิ้งค่าที่ส่งมา)', async () => {
      const { service, hourRequest } = setup(makeRequest());

      await service.approve(reviewer, 'req-1', { approvedHours: 4.5, approvedCategory: 'VOLUNTEER' });

      expect(hourRequest.update.mock.calls[0][0].data).toMatchObject({
        approvedHours: 4.5,
        approvedCategory: 'VOLUNTEER',
      });
    });

    it('แก้ผลตรวจได้: จาก "ไม่อนุมัติ" เป็นอนุมัติ แล้วล้างเหตุผลเดิม', async () => {
      const { service, hourRequest } = setup(
        makeRequest({ status: HourRequestStatus.REJECTED, rejectionReason: 'หลักฐานไม่ชัด' }),
      );

      const result = await service.approve(reviewer, 'req-1');

      expect(result.status).toBe(HourRequestStatus.APPROVED);
      expect(hourRequest.update.mock.calls[0][0].data.rejectionReason).toBeNull();
    });

    it('แก้ชั่วโมงของคำร้องที่อนุมัติไปแล้วได้ (อนุมัติซ้ำด้วยค่าใหม่)', async () => {
      const { service, hourRequest } = setup(
        makeRequest({ status: HourRequestStatus.APPROVED, approvedHours: 6, approvedCategory: 'COOP' }),
      );

      await service.approve(reviewer, 'req-1', { approvedHours: 3 });

      expect(hourRequest.update.mock.calls[0][0].data).toMatchObject({
        status: HourRequestStatus.APPROVED,
        approvedHours: 3,
      });
    });

    it('ไม่พบคำร้อง = 404 และไม่เขียนอะไร', async () => {
      const { service, hourRequest } = setup(null);

      await expect(service.approve(reviewer, 'missing')).rejects.toBeInstanceOf(AppException);
      expect(hourRequest.update).not.toHaveBeenCalled();
    });
  });

  describe('reject()', () => {
    it('ปฏิเสธคำร้องที่รอตรวจ พร้อมเหตุผล (ตัดช่องว่างหัวท้าย)', async () => {
      const { service, hourRequest } = setup(makeRequest());

      await service.reject(reviewer, 'req-1', '  หลักฐานไม่ครบ  ');

      expect(hourRequest.update.mock.calls[0][0].data).toMatchObject({
        status: HourRequestStatus.REJECTED,
        rejectionReason: 'หลักฐานไม่ครบ',
        reviewedBy: 'teacher-1',
      });
    });

    it('แก้ผลตรวจได้: ปฏิเสธคำร้องที่เคยอนุมัติ ต้องล้างชั่วโมงที่อนุมัติ เพื่อไม่ให้ถูกนับในยอดสะสม', async () => {
      const { service, hourRequest } = setup(
        makeRequest({ status: HourRequestStatus.APPROVED, approvedHours: 6, approvedCategory: 'COOP' }),
      );

      const result = await service.reject(reviewer, 'req-1', 'กดผิด ขอตรวจใหม่');

      expect(result.status).toBe(HourRequestStatus.REJECTED);
      expect(hourRequest.update.mock.calls[0][0].data).toMatchObject({
        approvedHours: null,
        approvedCategory: null,
      });
    });

    it('ไม่พบคำร้อง = 404 และไม่เขียนอะไร', async () => {
      const { service, hourRequest } = setup(null);

      await expect(service.reject(reviewer, 'missing', 'x')).rejects.toBeInstanceOf(AppException);
      expect(hourRequest.update).not.toHaveBeenCalled();
    });
  });
});

describe('HourRequestsService.listForReview (หน้าตรวจคำร้องของอาจารย์)', () => {
  function setupList(rows: Array<Record<string, unknown>>) {
    const findMany = jest.fn().mockResolvedValue(rows);
    const prisma = {
      hourRequest: { findMany, count: jest.fn().mockResolvedValue(rows.length) },
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    } as unknown as PrismaService;
    const people = { studentDirectory: jest.fn().mockResolvedValue(new Map()) } as unknown as PeopleService;
    return { service: new HourRequestsService(prisma, {} as ProfileService, people), findMany };
  }

  it('เรียงคำร้องที่ยื่นล่าสุดไว้บนสุด เก่าสุดอยู่ล่างสุด', async () => {
    const { service, findMany } = setupList([]);

    await service.listForReview({ skip: 0, take: 20 } as never, 'teacher-token');

    expect(findMany.mock.calls[0][0].orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
  });

  it('คืนรายการตามลำดับที่ฐานข้อมูลเรียงมา ไม่สลับลำดับเอง', async () => {
    const { service } = setupList([
      { id: 'new', personCode: null, createdAt: new Date('2026-10-05') },
      { id: 'old', personCode: null, createdAt: new Date('2026-10-01') },
    ]);

    const { items } = await service.listForReview({ skip: 0, take: 20 } as never, 't');

    expect(items.map((i) => i.id)).toEqual(['new', 'old']);
  });
});
