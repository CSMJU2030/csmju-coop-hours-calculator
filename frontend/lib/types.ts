/**
 * Domain types of this subsystem.
 *
 * เดิม import ชนิดข้อมูลจาก ORM ของฐานข้อมูลตรง ๆ ในหน้าเว็บ — ทำแบบนั้นไม่ได้แล้ว
 * เพราะ frontend ห้ามต่อฐานข้อมูล (ARC-01) และ Prisma ย้ายไปอยู่ backend หมดแล้ว
 * ค่าทุกตัวตรงกับ enum ใน backend/prisma/schema.prisma
 */

export const ActivityStatus = {
  OPEN: 'OPEN',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  COMPLETED: 'COMPLETED',
} as const;
export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];

export const RegistrationStatus = {
  REGISTERED: 'REGISTERED',
  WAITING: 'WAITING',
  ATTENDED: 'ATTENDED',
  ABSENT: 'ABSENT',
  CANCELLED: 'CANCELLED',
} as const;
export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const HourRequestStatus = {
  PENDING: 'PENDING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type HourRequestStatus = (typeof HourRequestStatus)[keyof typeof HourRequestStatus];

export const HourRequestCategory = {
  COOP: 'COOP',
  VOLUNTEER: 'VOLUNTEER',
  MAJOR: 'MAJOR',
} as const;
export type HourRequestCategory = (typeof HourRequestCategory)[keyof typeof HourRequestCategory];

/** คำร้องขอนับชั่วโมง — ตรงกับ model HourRequest ของ backend */
export interface HourRequest {
  id: string;
  coreUserId: string;
  activityId: string | null;
  studentCode: string | null;
  studentName: string;
  title: string;
  category: HourRequestCategory;
  hours: number;
  proofUrl: string | null;
  studentPhoto: string | null;
  description: string | null;
  status: HourRequestStatus;
  statusText: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  dateStr: string | null;
  timeStr: string | null;
  type: string | null;
  typeCategory: string | null;
  approvedHours: number | null;
  approvedCategory: string | null;
  imageProof: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  activityType: string;
  date: string;
  startTime: string;
  endTime: string;
  registrationOpen: string;
  registrationClose: string;
  registrationDeadline: string;
  capacity: number;
  hours: number;
  lecturerInCharge: string;
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
  status: ActivityStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
