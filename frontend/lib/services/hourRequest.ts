import { ApiError, apiFetch } from '@/lib/api';
import { HourRequestCategory, HourRequestStatus, type HourRequest } from '@/lib/types';

/**
 * ชั้นคำร้องขอนับชั่วโมง
 *
 * เดิมไฟล์นี้เรียก Prisma ตรง ๆ (ผิดกฎ ARC-01) ตอนนี้ยิงไป backend แทน
 * ชื่อฟังก์ชัน ชนิด error และรูปแบบข้อมูลที่คืนยังเหมือนเดิม หน้าเว็บจึงไม่ต้องแก้
 * การตรวจสิทธิ์และตรวจสถานะของจริงอยู่ที่ backend — ที่นี่แค่แปลง error กลับมา
 * เป็นชนิดเดิมเพื่อให้ try/catch ที่เขียนไว้แล้วยังจับได้เหมือนเดิม
 */

export class HourRequestNotFoundError extends Error {
  constructor() {
    super('ไม่พบคำร้องนี้ในระบบ');
    this.name = 'HourRequestNotFoundError';
  }
}

export class HourRequestStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HourRequestStateError';
  }
}

export class HourRequestOwnershipError extends Error {
  constructor() {
    super('คุณไม่มีสิทธิ์แก้ไขคำร้องนี้');
    this.name = 'HourRequestOwnershipError';
  }
}

export interface HourRequestInput {
  title: string;
  category?: HourRequestCategory | string;
  hours: number;
  proofUrl?: string | null;
  description?: string | null;
}

function parseCategory(category?: string): HourRequestCategory {
  if (category === 'VOLUNTEER') return HourRequestCategory.VOLUNTEER;
  if (category === 'MAJOR') return HourRequestCategory.MAJOR;
  return HourRequestCategory.COOP;
}

function validateInput(input: HourRequestInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new HourRequestStateError('กรุณากรอกชื่องาน/กิจกรรม');
  }
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new HourRequestStateError('จำนวนชั่วโมงต้องมากกว่า 0');
  }
}

/** แปลง ApiError จาก backend กลับเป็น error ชนิดเดิมของหน้าเว็บ */
function translate(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.status === 404) throw new HourRequestNotFoundError();
    if (error.status === 403) throw new HourRequestOwnershipError();
    throw new HourRequestStateError(error.message);
  }
  throw error;
}

function body(input: HourRequestInput) {
  return {
    title: input.title.trim(),
    category: parseCategory(input.category as string | undefined),
    hours: input.hours,
    proofUrl: input.proofUrl || null,
    description: input.description || null,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listMyHourRequests(_coreUserId?: string): Promise<HourRequest[]> {
  return apiFetch<HourRequest[]>('/hour-requests/me').catch(translate);
}

export async function listPendingHourRequests(): Promise<HourRequest[]> {
  return apiFetch<HourRequest[]>(`/hour-requests?status=${HourRequestStatus.PENDING}&page=1&limit=200`).catch(
    translate,
  );
}

export async function getHourRequestById(id: string): Promise<HourRequest | null> {
  try {
    return await apiFetch<HourRequest>(`/hour-requests/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return translate(error);
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createHourRequest(_identity: unknown, input: HourRequestInput): Promise<HourRequest> {
  validateInput(input);
  return apiFetch<HourRequest>('/hour-requests', { method: 'POST', body: body(input) }).catch(translate);
}

/** Student edits a REJECTED request and resubmits it — resets to PENDING. */
export async function resubmitHourRequest(
  _identity: unknown,
  requestId: string,
  input: HourRequestInput,
): Promise<HourRequest> {
  validateInput(input);
  return apiFetch<HourRequest>(`/hour-requests/${requestId}`, {
    method: 'PATCH',
    body: body(input),
  }).catch(translate);
}

/** Staff/admin approves a PENDING request */
export async function approveHourRequest(_identity: unknown, requestId: string): Promise<HourRequest> {
  return apiFetch<HourRequest>(`/hour-requests/${requestId}/approve`, { method: 'POST' }).catch(translate);
}

/** Staff/admin rejects a PENDING request with a required reason. */
export async function rejectHourRequest(
  _identity: unknown,
  requestId: string,
  reason: string,
): Promise<HourRequest> {
  if (!reason || reason.trim().length === 0) {
    throw new HourRequestStateError('กรุณาระบุเหตุผลที่ปฏิเสธหรือส่งกลับแก้ไข');
  }
  return apiFetch<HourRequest>(`/hour-requests/${requestId}/reject`, {
    method: 'POST',
    body: { reason: reason.trim() },
  }).catch(translate);
}

export async function deleteHourRequest(_identity: unknown, requestId: string): Promise<void> {
  await apiFetch(`/hour-requests/${requestId}`, { method: 'DELETE' }).catch(translate);
}
