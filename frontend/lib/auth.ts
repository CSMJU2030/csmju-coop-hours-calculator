import { ApiError, UnauthenticatedError, getCurrentUser } from '@/lib/api';

/**
 * ตัวตนของผู้ใช้สำหรับหน้าเว็บ
 *
 * ไฟล์นี้เคยเป็นตัวอ่าน header (x-user-id, x-layer1-role) ที่ middleware ปลอมให้
 * ซึ่ง auth-contract.md ระบุว่าเป็นสัญญาเก่าที่ไม่มีจริง และมีบั๊กร้ายแรง 2 จุด
 * (ทุกคนกลายเป็น admin / ไม่ login ก็เข้าได้)
 *
 * ตอนนี้ตัวตนมาจาก backend เท่านั้น ซึ่ง backend เป็นคน verify JWT ของ Core Hub
 * ด้วย RS256 + JWKS ตามมาตรฐาน (auth-contract.md ข้อ 4) หน้าเว็บไม่ตัดสินสิทธิ์เอง
 * อีกต่อไป — แค่เอาผลที่ backend ตัดสินแล้วมาแสดง
 *
 * ชื่อ export ทั้งหมดยังเหมือนเดิม ต่างแค่ getIdentity() เป็น async แล้ว
 * เพราะต้องถาม backend (เดิมอ่าน header ได้ทันที)
 */

export type Layer1Role = 'student' | 'staff' | 'admin' | 'alumni';
export type SubsystemRole = 'student' | 'admin';

export interface Identity {
  /** core_user_id — ค่า sub จาก token ของ Core Hub */
  userId: string;
  email: string;
  layer1Role: Layer1Role;
  faculty: string;
  isDeveloperException: boolean;
  subsystemRole: SubsystemRole;
}

export class UnauthorizedError extends Error {
  constructor(message = 'กรุณาเข้าสู่ระบบก่อนใช้งาน') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'คุณไม่มีสิทธิ์ทำรายการนี้') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** ดึงตัวตนของผู้ใช้ที่ login อยู่ — โยน UnauthorizedError เมื่อยังไม่ได้ login */
export async function getIdentity(): Promise<Identity> {
  try {
    const user = await getCurrentUser();

    return {
      userId: user.id,
      email: user.email,
      layer1Role: user.coreRole as Layer1Role,
      faculty: '',
      isDeveloperException: false,
      // backend ใช้ STUDENT / STAFF / ADMIN — หน้าเว็บเดิมรู้จักแค่ student / admin
      subsystemRole: user.subsystemRole === 'STUDENT' ? 'student' : 'admin',
    };
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      throw new UnauthorizedError();
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new ForbiddenError('บัญชีของคุณไม่มีสิทธิ์เข้าใช้ระบบนี้');
    }
    throw error;
  }
}

/** เหมือน getIdentity แต่คืน null แทนการโยน error */
export async function getIdentityOrNull(): Promise<Identity | null> {
  try {
    return await getIdentity();
  } catch {
    return null;
  }
}

/** โยน ForbiddenError ถ้าไม่ใช่อาจารย์/เจ้าหน้าที่ */
export function requireAdmin(identity: Identity): void {
  if (identity.subsystemRole !== 'admin') {
    throw new ForbiddenError('หน้านี้สำหรับอาจารย์/เจ้าหน้าที่เท่านั้น');
  }
}

/**
 * ใช้ในหน้าเว็บ (server component) แทน getIdentity()
 *
 * ถ้ายังไม่ได้ login จะพาไปหน้า login ของ Core Hub ให้เลย แทนที่จะโยน error
 * ออกไปจนกลายเป็นหน้า 500 (เดิมไม่เจอปัญหานี้เพราะ middleware ปลอมตัวตนให้เสมอ)
 */
export async function requireIdentity(nextPath = '/'): Promise<Identity> {
  const { redirect } = await import('next/navigation');
  try {
    return await getIdentity();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      // ใช้ path สัมพัทธ์: next.config ส่ง /auth/* ต่อไป backend เพื่อให้คุกกี้ state อยู่ origin เดียวกับหน้าเว็บ
      redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
    }
    throw error;
  }
}
