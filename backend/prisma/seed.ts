import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * ข้อมูลตั้งต้นสำหรับเครื่อง dev — มาจากฐานข้อมูลเดิมของทีม (phatnaree.sql)
 * ย้ายมาเป็นโครงสร้างใหม่ (core_user_id แทน username ตาม data-dictionary.md ข้อ 9.2)
 *
 * ผูกกับบัญชี dev จริงของ Core Hub (csmju2030-standards/fixtures/dev-accounts.json)
 * เพื่อให้ login แล้วเห็นข้อมูลเดิมได้ทันที:
 *   student@core.local (sub: user-002) = นักศึกษาเดิม (username เดิม 6512345678)
 *   staff@core.local   (sub: user-003) = อาจารย์ที่สร้างกิจกรรมไว้เดิม
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const STUDENT_CORE_USER_ID = 'user-002'; // student@core.local
const STAFF_CORE_USER_ID = 'user-003'; // staff@core.local

async function main() {
  const student = await prisma.userProfile.upsert({
    where: { coreUserId: STUDENT_CORE_USER_ID },
    update: {},
    create: {
      coreUserId: STUDENT_CORE_USER_ID,
      coreRole: 'student',
      // รหัสตัวอย่างสำหรับทดสอบในเครื่อง — ชื่อ/สาขา/ชั้นปีไม่เก็บ ดึงจาก Core Hub ตอนแสดงผล (reference-data.md ข้อ 8)
      personCode: '0000000000',
    },
  });

  await prisma.userProfile.upsert({
    where: { coreUserId: STAFF_CORE_USER_ID },
    update: {},
    create: {
      coreUserId: STAFF_CORE_USER_ID,
      coreRole: 'staff',
    },
  });

  await prisma.userHourSummary.upsert({
    where: { coreUserId: STUDENT_CORE_USER_ID },
    update: {},
    create: { coreUserId: STUDENT_CORE_USER_ID, coopHours: 6, volunteerHours: 3, majorHours: 1.5 },
  });

  const activity1 = await prisma.activity.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'ค่ายอาสาพัฒนาห้องสมุดโรงเรียน',
      description: 'กิจกรรมจิตอาสาปรับปรุงและจัดระเบียบห้องสมุดโรงเรียนบ้านแม่โจ้ ร่วมกับชุมนุมอาสา',
      location: 'โรงเรียนบ้านแม่โจ้ อ.สันทราย',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationOpen: new Date(),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      registrationClose: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      capacity: 3,
      lecturerInCharge: 'อาจารย์ผู้รับผิดชอบ (ตัวอย่าง)',
      coopHours: 4,
      volunteerHours: 4,
      majorHours: 0,
      hours: 4,
      status: 'OPEN',
      createdBy: STAFF_CORE_USER_ID,
    },
  });

  const activity2 = await prisma.activity.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      title: 'จัดหนังสือ',
      description: 'จัดหนังสือเข้าชั้น',
      location: 'ห้องสมุด',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      registrationOpen: new Date(),
      registrationDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      registrationClose: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      capacity: 50,
      lecturerInCharge: 'ทิพย์',
      coopHours: 7,
      volunteerHours: 0,
      majorHours: 0,
      hours: 7,
      status: 'OPEN',
      createdBy: STUDENT_CORE_USER_ID,
    },
  });

  // ในฐานข้อมูลเดิมนักศึกษาคนนี้เคยลงทะเบียนกิจกรรม 2 แล้วยกเลิก — ย้ายประวัติมาด้วย
  await prisma.registration.upsert({
    where: { activityId_coreUserId: { activityId: activity2.id, coreUserId: STUDENT_CORE_USER_ID } },
    update: {},
    create: {
      activityId: activity2.id,
      coreUserId: STUDENT_CORE_USER_ID,
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  console.log('Seed complete.', { activities: [activity1.id, activity2.id] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
