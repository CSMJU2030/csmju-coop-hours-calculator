import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * frontend คือ origin สาธารณะเดียวของระบบย่อย: เส้น SSO สามเส้น (auth-contract 5) ถูกส่งต่อไป NestJS
 * ทำให้ callback ที่ลงทะเบียนใน Core Hub (http://localhost:3210/auth/callback), คุกกี้ state ของ
 * /auth/login และคุกกี้ session แบบ HttpOnly อยู่ origin เดียวกับหน้าเว็บ
 *
 * next build ฝัง rewrites ลงไฟล์ build จึงอ่าน BACKEND_URL ตอน build เท่านั้น:
 * ตอน dev มาจาก .env.local ส่วนใน image มาจาก frontend/Dockerfile (http://api:4000) — deployment.md ข้อ 3.2
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:4210').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // deployment.md ข้อ 3: image มีแค่ server ที่ trace แล้ว (DEP-04)
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    // pnpm เก็บ dependency ไว้ที่รากของ workspace — ต้อง trace จากราก ไม่งั้น standalone ขาดแพ็กเกจ
    outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      { source: '/auth/login', destination: `${BACKEND_URL}/auth/login` },
      { source: '/auth/callback', destination: `${BACKEND_URL}/auth/callback` },
      { source: '/auth/logout', destination: `${BACKEND_URL}/auth/logout` },
    ];
  },
};

export default nextConfig;
