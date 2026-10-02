import { apiFetch } from '@/lib/api';
import { ActivityStatus, RegistrationStatus } from '@/lib/types';
import { MAX_WAITLIST_SIZE } from '@/lib/utils';

/**
 * ชั้นอ่านข้อมูลของหน้าเว็บ
 *
 * เดิมไฟล์นี้เรียก Prisma ตรง ๆ ซึ่งผิดกฎ ARC-01 — ตอนนี้ยิงไป backend แทน
 * ชื่อฟังก์ชันและรูปแบบข้อมูลที่คืนออกไปยังเหมือนเดิมทุกตัว หน้าเว็บจึงไม่ต้องแก้
 *
 * หมายเหตุเรื่องชนิดข้อมูล: JSON ไม่มีชนิด Date ค่าที่ backend ส่งมาจึงเป็น string
 * ฟังก์ชันในไฟล์นี้จะแปลงกลับเป็น Date ให้ก่อนคืนออกไป เพื่อให้หน้าเว็บที่เรียก
 * .toLocaleDateString() อยู่เดิมทำงานได้เหมือนเดิม
 */

export type ActivityBadge =
  | { kind: 'REGISTERED' }
  | { kind: 'WAITING'; queueNumber: number }
  | { kind: 'AVAILABLE'; seatsLeft: number }
  | { kind: 'WAITLIST_OPEN'; spotsLeft: number }
  | { kind: 'FULL' }
  | { kind: 'CLOSED' };

export interface ActivityWithBadge {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  registrationDeadline: Date;
  capacity: number;
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
  status: ActivityStatus;
  registeredCount: number;
  waitingCount: number;
  badge: ActivityBadge;
}

function computeBadge(params: {
  status: ActivityStatus;
  registeredCount: number;
  waitingCount: number;
  capacity: number;
  deadline: Date;
  myStatus?: RegistrationStatus;
  myQueueNumber?: number | null;
}): ActivityBadge {
  const { status, registeredCount, waitingCount, capacity, deadline, myStatus, myQueueNumber } = params;

  if (myStatus === RegistrationStatus.REGISTERED) return { kind: 'REGISTERED' };
  if (myStatus === RegistrationStatus.WAITING) {
    return { kind: 'WAITING', queueNumber: myQueueNumber ?? 0 };
  }

  if (status !== ActivityStatus.OPEN || new Date() > deadline) return { kind: 'CLOSED' };

  const seatsLeft = capacity - registeredCount;
  if (seatsLeft > 0) return { kind: 'AVAILABLE', seatsLeft };

  const spotsLeft = MAX_WAITLIST_SIZE - waitingCount;
  if (spotsLeft > 0) return { kind: 'WAITLIST_OPEN', spotsLeft };

  return { kind: 'FULL' };
}

interface ApiActivity {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  hours: number;
  activityType: string;
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
  status: ActivityStatus;
  registeredCount?: number;
  waitingCount?: number;
  _count?: { registrations: number };
}

interface ApiRegistration {
  id: string;
  activityId: string;
  status: RegistrationStatus;
  queueNumber: number | null;
  creditedCoopHours: number | null;
  creditedVolunteerHours: number | null;
  creditedMajorHours: number | null;
  activity: { title: string; startTime: string };
}

/** ดึงกิจกรรมทั้งหมด (backend ใส่ pagination ไว้ — หน้านี้ขอทีเดียวให้ครบ) */
async function fetchAllActivities(): Promise<ApiActivity[]> {
  return apiFetch<ApiActivity[]>('/activities?page=1&limit=100');
}

/**
 * Activities for the student dashboard, each annotated with this user's
 * registration status and a ready-to-render badge.
 *
 * พารามิเตอร์ตัวแรกไม่ถูกใช้แล้ว เพราะ backend รู้ว่าใครเรียกจาก token
 * (เดิมส่ง username เข้ามา) — คงพารามิเตอร์ไว้เพื่อไม่ให้หน้าเว็บที่เรียกอยู่พัง
 */
export async function getActivitiesForStudent(_coreUserId?: string): Promise<ActivityWithBadge[]> {
  const [activities, myRegistrations] = await Promise.all([
    fetchAllActivities(),
    apiFetch<ApiRegistration[]>('/registrations/me'),
  ]);

  const mineByActivity = new Map(myRegistrations.map((r) => [r.activityId, r]));

  return activities
    .map((a) => {
      const mine = mineByActivity.get(a.id);
      const registeredCount = a.registeredCount ?? a._count?.registrations ?? 0;
      const waitingCount = a.waitingCount ?? 0;
      const deadline = new Date(a.registrationDeadline);

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        location: a.location,
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
        registrationDeadline: deadline,
        capacity: a.capacity,
        coopHours: a.coopHours,
        volunteerHours: a.volunteerHours,
        majorHours: a.majorHours,
        status: a.status,
        registeredCount,
        waitingCount,
        badge: computeBadge({
          status: a.status,
          registeredCount,
          waitingCount,
          capacity: a.capacity,
          deadline,
          myStatus: mine?.status,
          myQueueNumber: mine?.queueNumber,
        }),
      };
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export interface MyRegistrationRow {
  registrationId: string;
  activityId: string;
  activityTitle: string;
  status: RegistrationStatus;
  queueNumber: number | null;
  startTime: Date;
  creditedCoopHours: number | null;
  creditedVolunteerHours: number | null;
  creditedMajorHours: number | null;
}

export async function getMyRegistrations(_coreUserId?: string): Promise<MyRegistrationRow[]> {
  const rows = await apiFetch<ApiRegistration[]>('/registrations/me');

  return rows.map((r) => ({
    registrationId: r.id,
    activityId: r.activityId,
    activityTitle: r.activity.title,
    status: r.status,
    queueNumber: r.queueNumber,
    startTime: new Date(r.activity.startTime),
    creditedCoopHours: r.creditedCoopHours,
    creditedVolunteerHours: r.creditedVolunteerHours,
    creditedMajorHours: r.creditedMajorHours,
  }));
}

/** Convenience map for pages that need registrationId by activityId. */
export function toRegistrationIdMap(rows: MyRegistrationRow[]): Map<string, string> {
  return new Map(rows.map((r) => [r.activityId, r.registrationId]));
}

export async function getHourSummary(_coreUserId?: string) {
  const dashboard = await apiFetch<{
    summary: { coopHours: number; volunteerHours: number; majorHours: number };
  }>('/me/dashboard');

  return {
    coopHours: dashboard.summary.coopHours ?? 0,
    volunteerHours: dashboard.summary.volunteerHours ?? 0,
    majorHours: dashboard.summary.majorHours ?? 0,
  };
}

export async function getActivitiesForAdmin() {
  const activities = await fetchAllActivities();

  return activities
    .map((a) => ({
      id: a.id,
      title: a.title,
      startTime: new Date(a.startTime),
      location: a.location,
      status: a.status,
      capacity: a.capacity,
      registeredCount: a.registeredCount ?? a._count?.registrations ?? 0,
      waitingCount: a.waitingCount ?? 0,
    }))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

export interface AttendanceRow {
  registrationId: string;
  username: string;
  displayName: string | null;
  major: string | null;
  yearLevel: number | null;
  status: RegistrationStatus;
  queueNumber: number | null;
}

interface ApiRosterRow {
  id: string;
  coreUserId: string;
  status: RegistrationStatus;
  queueNumber: number | null;
  userProfile: {
    displayName: string | null;
    fullName: string | null;
    major: string | null;
    yearLevel: number | null;
  };
}

function toAttendanceRow(r: ApiRosterRow): AttendanceRow {
  return {
    registrationId: r.id,
    // ฟิลด์นี้ชื่อ username มาแต่เดิม แต่ค่าที่ใส่คือ core_user_id ตามมาตรฐาน
    // (data-dictionary.md ข้อ 9.2) — เก็บชื่อเดิมไว้เพื่อไม่ให้หน้าเว็บพัง
    username: r.coreUserId,
    displayName: r.userProfile?.displayName ?? r.userProfile?.fullName ?? null,
    major: r.userProfile?.major ?? null,
    yearLevel: r.userProfile?.yearLevel ?? null,
    status: r.status,
    queueNumber: r.queueNumber,
  };
}

export async function getAttendanceRoster(activityId: string) {
  const roster = await apiFetch<{
    activity: ApiActivity;
    seated: ApiRosterRow[];
    waiting: ApiRosterRow[];
  }>(`/activities/${activityId}/attendance`);

  if (!roster?.activity) return null;

  return {
    activity: {
      ...roster.activity,
      date: new Date((roster.activity as unknown as { date: string }).date ?? roster.activity.startTime),
      startTime: new Date(roster.activity.startTime),
      endTime: new Date(roster.activity.endTime),
      registrationDeadline: new Date(roster.activity.registrationDeadline),
    },
    seated: roster.seated.map(toAttendanceRow),
    waiting: roster.waiting.map(toAttendanceRow),
  };
}

export async function getPrintRoster(activityId: string) {
  return getAttendanceRoster(activityId);
}

// ---------------------------------------------------------------------------
// สรุปรายชื่อนักศึกษา (Admin) — hour totals per student for the summary page
// ---------------------------------------------------------------------------

export interface StudentSummaryRow {
  username: string;
  displayName: string | null;
  major: string | null;
  yearLevel: number | null;
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
  eligible: boolean;
}

export async function getAllStudentsSummary(): Promise<StudentSummaryRow[]> {
  const rows = await apiFetch<
    Array<{
      coreUserId: string;
      studentCode: string | null;
      displayName: string | null;
      major: string | null;
      yearLevel: number | null;
      coopHours: number;
      volunteerHours: number;
      majorHours: number;
      eligible: boolean;
    }>
  >('/students/summary');

  return rows.map((r) => ({
    // แสดงรหัสนักศึกษาถ้ามี ไม่มีค่อยใช้ core_user_id
    username: r.studentCode ?? r.coreUserId,
    displayName: r.displayName,
    major: r.major,
    yearLevel: r.yearLevel,
    coopHours: r.coopHours,
    volunteerHours: r.volunteerHours,
    majorHours: r.majorHours,
    eligible: r.eligible,
  }));
}
