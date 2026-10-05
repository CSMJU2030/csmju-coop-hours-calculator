import { RegistrationStatus } from '../../generated/prisma/client';
import { PeopleService } from '../core-hub/people.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../users/profile.service';
import { RegistrationsService } from './registrations.service';

const activity = { id: 'act-1', title: 'กิจกรรมทดสอบ' };

const reg = (id: string, status: RegistrationStatus, personCode: string | null) => ({
  id,
  coreUserId: `uid-${id}`,
  status,
  queueNumber: null,
  userProfile: { personCode },
});

function setup(rows: ReturnType<typeof reg>[], directory: Map<string, unknown>) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const prisma = {
    activity: { findUnique: jest.fn().mockResolvedValue(activity) },
    registration: { findMany },
  } as unknown as PrismaService;
  const people = { studentDirectory: jest.fn().mockResolvedValue(directory) } as unknown as PeopleService;
  const service = new RegistrationsService(prisma, {} as ProfileService, people);
  return { service, findMany, people };
}

describe('RegistrationsService.roster (ใบเซ็นชื่อ / หน้าเช็กชื่อ)', () => {
  it('ส่งรหัสนักศึกษาและชื่อจาก Core Hub ไปกับแต่ละแถว (ชื่อไม่ได้อยู่ในฐานข้อมูลเรา)', async () => {
    const directory = new Map([
      [
        'S001',
        { personCode: 'S001', fullNameTh: 'นักศึกษา ทดสอบหนึ่ง', entryYear: 2567, departmentNameTh: 'วิทยาการคอมพิวเตอร์' },
      ],
    ]);
    const { service, people } = setup([reg('1', RegistrationStatus.REGISTERED, 'S001')], directory);

    const { seated } = await service.roster('act-1', 'teacher-token');

    expect(people.studentDirectory).toHaveBeenCalledWith('teacher-token');
    expect(seated).toHaveLength(1);
    expect(seated[0].coreUserId).toBe('uid-1');
    expect(seated[0].userProfile).toMatchObject({
      personCode: 'S001',
      displayName: 'นักศึกษา ทดสอบหนึ่ง',
      major: 'วิทยาการคอมพิวเตอร์',
    });
  });

  it('คนที่หาชื่อไม่เจอใน Core Hub ยังอยู่ในรายชื่อ (แสดงแค่รหัส) ไม่ทำให้ใบเซ็นชื่อพัง', async () => {
    const { service } = setup([reg('1', RegistrationStatus.REGISTERED, 'S404')], new Map());

    const { seated } = await service.roster('act-1', 't');

    expect(seated[0].userProfile).toMatchObject({ personCode: 'S404', displayName: null });
  });

  it('แยกผู้ที่นั่งในกิจกรรม (ลงทะเบียน/เข้าร่วม/ขาด) ออกจากคิวสำรอง', async () => {
    const { service } = setup(
      [
        reg('a', RegistrationStatus.REGISTERED, 'S1'),
        reg('b', RegistrationStatus.ATTENDED, 'S2'),
        reg('c', RegistrationStatus.ABSENT, 'S3'),
        reg('d', RegistrationStatus.WAITING, 'S4'),
      ],
      new Map(),
    );

    const { seated, waiting } = await service.roster('act-1', 't');

    expect(seated.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(waiting.map((r) => r.id)).toEqual(['d']);
  });

  it('ไม่ดึงคนที่ยกเลิกการลงทะเบียนมาที่ฐานข้อมูลเลย', async () => {
    const { service, findMany } = setup([], new Map());

    await service.roster('act-1', 't');

    expect(findMany.mock.calls[0][0].where).toEqual({
      activityId: 'act-1',
      status: { not: RegistrationStatus.CANCELLED },
    });
  });
});
