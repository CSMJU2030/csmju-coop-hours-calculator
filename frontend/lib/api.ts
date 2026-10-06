import { cookies, headers } from 'next/headers';

/**
 * ตัวเชื่อมจาก Next.js ไปยัง backend NestJS ของระบบย่อยนี้
 *
 * frontend ห้ามต่อ PostgreSQL ตรง (ARC-01) — ทุกอย่างต้องผ่าน backend
 * ตัว token จริงอยู่ในคุกกี้ httpOnly ที่ /auth/callback เป็นคนตั้ง ดังนั้น
 * โค้ดฝั่ง browser จึงไม่เคยเห็น token เลย มีแต่ server component /
 * route handler ที่หยิบคุกกี้ส่งต่อไป backend
 */

// BACKEND_URL ตัวเดียวกับที่ next.config.mjs ใช้ — ตอน dev มาจาก .env.local ใน image คือ http://api:4000 (deployment.md ข้อ 3.2)
const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:4210').replace(/\/+$/, '');
const BACKEND_API_URL = `${BACKEND_URL}/api/v1`;

/**
 * ชื่อคุกกี้ session ต้องตรงกับ ssoCookieNames(SUBSYSTEM_ID).session ใน backend/src/auth/sso-session.ts
 * (`<subsystem_id ที่ - เป็น _>_access_token`)
 */
const SUBSYSTEM_ID = process.env.SUBSYSTEM_ID ?? 'csmju-coop-hours-calculator';
export const SESSION_COOKIE = `${SUBSYSTEM_ID.replace(/-/g, '_')}_access_token`;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthenticatedError extends ApiError {
  constructor(message = 'กรุณาเข้าสู่ระบบก่อนใช้งาน') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthenticatedError';
  }
}

function sessionToken(): string | null {
  // ระหว่าง dev ที่ยังไม่ผูก Core Hub สามารถส่ง token ทาง header ได้ (เช่น curl)
  const authorization = headers().get('authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** ค่าเริ่มต้นคือไม่แคช เพราะข้อมูลของแต่ละคนไม่เหมือนกัน */
  cache?: RequestCache;
}

/**
 * ยิงไป backend แล้วแกะ envelope { success, data } ออกมาให้
 * error envelope { success:false, error:{ code, message } } จะถูกแปลงเป็น ApiError
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = sessionToken();

  if (!token) {
    throw new UnauthenticatedError();
  }

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: requestHeaders,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? 'no-store',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const error = payload?.error;
    throw new ApiError(
      error?.message ?? 'ไม่สามารถติดต่อระบบหลังบ้านได้',
      response.status,
      error?.code ?? 'INTERNAL_ERROR',
    );
  }

  return payload?.data as T;
}

/** เหมือน apiFetch แต่คืน null เมื่อยังไม่ได้ login (ใช้กับหน้าที่แสดงผลได้บางส่วน) */
export async function apiFetchOrNull<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof UnauthenticatedError) return null;
    throw error;
  }
}

export function isLoggedIn(): boolean {
  return sessionToken() !== null;
}

/** ตัวตนของผู้ใช้ที่ login อยู่ ตามที่ backend ตรวจ JWT แล้วสรุปให้ */
export interface CurrentUser {
  id: string;
  email: string;
  coreRole: string;
  subsystemRole: 'STUDENT' | 'STAFF' | 'ADMIN' | 'ALUMNI';
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/me');
}

export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  return apiFetchOrNull<CurrentUser>('/me');
}

/** โปรไฟล์ของผู้ใช้ที่ login อยู่ — ชื่อมาจาก Core Hub (/people/me) ผ่าน backend ไม่ได้เก็บในระบบนี้ */
export interface MyProfile {
  coreUserId: string;
  coreRole: string;
  personCode: string | null;
  displayName: string | null;
}

/** คืน null เมื่อยังไม่ login หรือดึงไม่ได้ — ใช้กับ layout ที่ต้องแสดงผลได้เสมอ */
export async function getMyProfileOrNull(): Promise<MyProfile | null> {
  try {
    return await apiFetchOrNull<MyProfile>('/me/profile');
  } catch {
    return null;
  }
}

export function isAdminRole(user: { subsystemRole: string } | null): boolean {
  return user?.subsystemRole === 'STAFF' || user?.subsystemRole === 'ADMIN';
}
