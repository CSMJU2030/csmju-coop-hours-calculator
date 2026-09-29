import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { getIdentityOrNull } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'ระบบติดตามชั่วโมงสหกิจและกิจกรรม | CSMJU2030',
  description:
    'CSMJU Co-op Prep & Activity Hours Tracking System — สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // ดึงตัวตนจริงมาแสดงใน NavBar (เดิม component รับ prop นี้อยู่แล้วแต่ไม่เคยมีใครส่งให้
  // เลยเห็นชื่อปลอม hardcode ตลอด) — ใช้ getIdentityOrNull ไม่ใช่ requireIdentity
  // เพื่อไม่เปลี่ยนพฤติกรรมเดิมที่หน้า /dashboard ยอมให้ render แม้ยังไม่ login
  const identity = await getIdentityOrNull();

  return (
    <html lang="th">
      <body>
        <NavBar userId={identity?.email} isAdmin={identity?.subsystemRole === 'admin'} />

        <main className="min-h-[calc(100vh-76px)] lg:ml-[250px]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}