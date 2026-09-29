import { randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Central SSO cookies (auth-contract.md ข้อ 5.1, 5.2).
 *
 * ชื่อคุกกี้ขึ้นต้นด้วยชื่อระบบ (`-` → `_`) เพราะตอนพัฒนาทุกระบบรันบน localhost
 * และคุกกี้ไม่แยกตาม port
 *
 * ค่าของคุกกี้ session คือ Core Hub token ตัวที่ verify แล้วเท่านั้น — ระบบย่อย
 * ไม่ออก token/session ของตัวเอง
 */
export const SUBSYSTEM_COOKIE_PREFIX = 'csmju_coop_hours';
export const SSO_COOKIE_NAME = `${SUBSYSTEM_COOKIE_PREFIX}_access_token`;
export const SSO_STATE_COOKIE_NAME = `${SUBSYSTEM_COOKIE_PREFIX}_sso_state`;
export const SSO_STATE_COOKIE_PATH = '/auth/callback';
export const SSO_STATE_MAX_AGE_SEC = 600;
export const DEFAULT_NEXT_PATH = '/';

/** Reads one cookie out of a raw `Cookie:` header without extra dependencies. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    if (part.slice(0, separator).trim() !== name) {
      continue;
    }

    const value = part.slice(separator + 1).trim();

    return value.length > 0 ? decodeURIComponent(value) : null;
  }

  return null;
}

function serialize(
  name: string,
  value: string,
  options: { path: string; maxAgeSec: number; secure: boolean },
): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(options.maxAgeSec))}`,
  ];

  if (options.secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

/** Session cookie. `maxAgeSec` = exp − now (never longer than the token). */
export function buildSsoCookie(token: string, maxAgeSec: number, secure: boolean): string {
  return serialize(SSO_COOKIE_NAME, token, { path: '/', maxAgeSec, secure });
}

export function clearSsoCookie(secure: boolean): string {
  return serialize(SSO_COOKIE_NAME, '', { path: '/', maxAgeSec: 0, secure });
}

export function buildStateCookie(state: string, next: string, secure: boolean): string {
  const value = `${state}.${Buffer.from(next, 'utf8').toString('base64url')}`;
  return serialize(SSO_STATE_COOKIE_NAME, value, {
    path: SSO_STATE_COOKIE_PATH,
    maxAgeSec: SSO_STATE_MAX_AGE_SEC,
    secure,
  });
}

export function clearStateCookie(secure: boolean): string {
  return serialize(SSO_STATE_COOKIE_NAME, '', {
    path: SSO_STATE_COOKIE_PATH,
    maxAgeSec: 0,
    secure,
  });
}

/** `state` สุ่ม 32 ไบต์ เข้ารหัส base64url (ข้อ 5.2) */
export function generateState(): string {
  return randomBytes(32).toString('base64url');
}

/** แยกค่าในคุกกี้ state → { state, next } · รูปแบบผิดคืน null */
export function parseStateCookie(value: string | null): { state: string; next: string } | null {
  if (!value) {
    return null;
  }
  const separator = value.indexOf('.');
  if (separator <= 0) {
    return null;
  }
  const state = value.slice(0, separator);
  let next: string;
  try {
    next = Buffer.from(value.slice(separator + 1), 'base64url').toString('utf8');
  } catch {
    return null;
  }
  return { state, next };
}

/** เทียบ state แบบ constant-time */
export function statesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * กฎของ `next` (ข้อ 5.2) — ผ่านครบทุกข้อจึงใช้ได้ ไม่ผ่านใช้หน้า default
 *  1. string ยาว 1–512
 *  2. ขึ้นต้น `/` ไม่ขึ้นต้น `//` และไม่มี `\`
 *  3. ไม่มีอักขระควบคุม
 *  4. new URL(next, origin ตัวเอง) แล้ว origin ต้องไม่เปลี่ยน
 *  5. ไม่ใช่ `/auth` หรือ path ใต้ `/auth/`
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== 'string' || next.length < 1 || next.length > 512) {
    return DEFAULT_NEXT_PATH;
  }
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return DEFAULT_NEXT_PATH;
  }
  for (let i = 0; i < next.length; i += 1) {
    const code = next.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return DEFAULT_NEXT_PATH;
    }
  }
  const origin = 'http://subsystem.invalid';
  let resolved: URL;
  try {
    resolved = new URL(next, origin);
  } catch {
    return DEFAULT_NEXT_PATH;
  }
  if (resolved.origin !== origin) {
    return DEFAULT_NEXT_PATH;
  }
  if (resolved.pathname === '/auth' || resolved.pathname.startsWith('/auth/')) {
    return DEFAULT_NEXT_PATH;
  }
  return next;
}
