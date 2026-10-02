/**
 * frontend คือ origin สาธารณะเดียวของระบบย่อย: เส้น SSO สามเส้น (auth-contract 5) ถูกส่งต่อไป NestJS
 * ทำให้ callback ที่ลงทะเบียนใน Core Hub (http://localhost:3210/auth/callback), คุกกี้ state ของ
 * /auth/login และคุกกี้ session แบบ HttpOnly อยู่ origin เดียวกับหน้าเว็บ
 */
const BACKEND_URL = (process.env.BACKEND_API_URL ?? 'http://127.0.0.1:4210/api/v1').replace(/\/api\/v1\/?$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
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
