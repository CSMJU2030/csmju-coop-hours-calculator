import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/api';

/**
 * ออกจากระบบ
 *
 * คุกกี้ session ถูกตั้งโดย backend (`POST /auth/logout` ที่พอร์ต backend) แต่
 * ใช้ร่วมกันได้ระหว่าง frontend/backend เพราะคุกกี้ผูกกับ host ("localhost")
 * ไม่ใช่พอร์ต (RFC 6265) เส้นนี้เลยเคลียร์คุกกี้จากฝั่ง frontend ได้ตรงๆ โดยไม่ต้อง
 * เรียกข้าม origin ไปหา backend แล้วค่อยพาไปหน้า logout ของ Core Hub ต่อ
 */
export const dynamic = 'force-dynamic';

const CORE_HUB_WEB_URL = (process.env.CORE_HUB_WEB_URL ?? 'https://csmju2030.jowave.com').replace(/\/+$/, '');

export async function POST() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.redirect(`${CORE_HUB_WEB_URL}/logout`, { status: 303 });
}
