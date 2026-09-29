'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ApiError, UnauthenticatedError, apiFetch } from '@/lib/api';
import { ActivityStatus, RegistrationStatus } from '@/lib/types';

/**
 * Server actions ของหน้าเว็บ
 *
 * เดิมไฟล์นี้เปิด transaction กับ PostgreSQL เอง (ผิดกฎ ARC-01) ตอนนี้ยิงไป
 * backend แทน — ตรรกะกันที่นั่งชนกัน เลื่อนคิวสำรอง และการให้ชั่วโมงย้ายไปอยู่ใน
 * backend/src/registrations/registrations.service.ts ครบแล้ว (ยังใช้
 * Serializable transaction เหมือนเดิม)
 *
 * ชื่อฟังก์ชัน พารามิเตอร์ และรูปแบบ ActionResult ยังเหมือนเดิมทุกตัว
 * component ที่เรียกอยู่ (NewActivityForm, RegisterButton, AttendanceForm,
 * StatusToggle) จึงไม่ต้องแก้อะไรเลย
 */

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleKnownErrors(err: unknown): ActionResult<never> {
  if (err instanceof UnauthenticatedError) {
    return { success: false, error: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่' };
  }
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return { success: false, error: 'คุณไม่มีสิทธิ์ทำรายการนี้ (ต้องเป็นเจ้าหน้าที่/อาจารย์)' };
    }
    // ข้อความจาก backend เป็นภาษาไทยอยู่แล้ว ส่งต่อให้ผู้ใช้เห็นได้เลย
    return { success: false, error: err.message };
  }
  if (err instanceof z.ZodError) {
    return { success: false, error: err.errors.map((e) => e.message).join(', ') };
  }
  console.error('[csmju-coop-hours-calculator] Unhandled action error:', err);
  return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง' };
}

// ---------------------------------------------------------------------------
// 1. createActivity — admin only
// ---------------------------------------------------------------------------

const createActivitySchema = z
  .object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่อกิจกรรม').max(200),
    description: z.string().trim().min(1, 'กรุณากรอกรายละเอียดกิจกรรม'),
    location: z.string().trim().min(1, 'กรุณากรอกสถานที่'),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    registrationDeadline: z.coerce.date(),
    capacity: z.coerce.number().int().min(1, 'จำนวนที่นั่งต้องมากกว่า 0'),
    lecturerInCharge: z.string().trim().min(1, 'กรุณาระบุอาจารย์ผู้รับผิดชอบ'),
    coopHours: z.coerce.number().min(0).default(0),
    volunteerHours: z.coerce.number().min(0).default(0),
    majorHours: z.coerce.number().min(0).default(0),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มกิจกรรม',
    path: ['endTime'],
  })
  .refine((data) => data.registrationDeadline <= data.startTime, {
    message: 'วันปิดรับสมัครต้องอยู่ก่อนหรือเท่ากับเวลาเริ่มกิจกรรม',
    path: ['registrationDeadline'],
  })
  .refine((data) => data.coopHours > 0 || data.volunteerHours > 0 || data.majorHours > 0, {
    message: 'กิจกรรมต้องให้ชั่วโมงอย่างน้อยหนึ่งประเภท',
    path: ['coopHours'],
  });

export async function createActivity(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createActivitySchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      registrationDeadline: formData.get('registrationDeadline'),
      capacity: formData.get('capacity'),
      lecturerInCharge: formData.get('lecturerInCharge'),
      coopHours: formData.get('coopHours') ?? 0,
      volunteerHours: formData.get('volunteerHours') ?? 0,
      majorHours: formData.get('majorHours') ?? 0,
    });

    const created = await apiFetch<{ id: string }>('/activities', {
      method: 'POST',
      body: {
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        startTime: parsed.startTime.toISOString(),
        endTime: parsed.endTime.toISOString(),
        registrationDeadline: parsed.registrationDeadline.toISOString(),
        capacity: parsed.capacity,
        lecturerInCharge: parsed.lecturerInCharge,
        coopHours: parsed.coopHours,
        volunteerHours: parsed.volunteerHours,
        majorHours: parsed.majorHours,
      },
    });

    revalidatePath('/admin/activities');
    revalidatePath('/dashboard');
    return { success: true, data: { id: created.id } };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 2. registerActivity — student self-registration, race-condition safe
// ---------------------------------------------------------------------------

export async function registerActivity(
  activityId: string,
): Promise<ActionResult<{ status: RegistrationStatus; queueNumber: number | null }>> {
  try {
    const registration = await apiFetch<{ status: RegistrationStatus; queueNumber: number | null }>(
      '/registrations',
      { method: 'POST', body: { activityId } },
    );

    revalidatePath('/dashboard');
    return {
      success: true,
      data: { status: registration.status, queueNumber: registration.queueNumber },
    };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 3. cancelRegistration — with waiting-list auto-promotion
// ---------------------------------------------------------------------------

export async function cancelRegistration(registrationId: string): Promise<ActionResult> {
  try {
    await apiFetch(`/registrations/${registrationId}`, { method: 'DELETE' });

    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 4. batchConfirmAttendance — admin only, credits hours immediately
// ---------------------------------------------------------------------------

export async function batchConfirmAttendance(
  activityId: string,
  attendedUsernames: string[],
): Promise<ActionResult<{ attended: number; absent: number }>> {
  try {
    // ค่าที่ส่งเข้ามาคือ core_user_id (หน้าเว็บยังเรียกตัวแปรนี้ว่า username อยู่)
    const result = await apiFetch<{ attended: number; absent: number }>(
      `/activities/${activityId}/attendance`,
      { method: 'POST', body: { attendedCoreUserIds: attendedUsernames } },
    );

    revalidatePath(`/admin/activities/${activityId}/attendance`);
    revalidatePath('/dashboard');
    return { success: true, data: result };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 5. closeActivity — convenience admin action used by the activities list
// ---------------------------------------------------------------------------

export async function setActivityStatus(
  activityId: string,
  status: ActivityStatus,
): Promise<ActionResult> {
  try {
    await apiFetch(`/activities/${activityId}/status`, { method: 'PATCH', body: { status } });

    revalidatePath('/admin/activities');
    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (err) {
    return handleKnownErrors(err);
  }
}
