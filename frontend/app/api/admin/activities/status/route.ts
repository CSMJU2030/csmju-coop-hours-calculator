import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { toErrorResponse } from '@/lib/routeErrors';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/** เปลี่ยนสถานะกิจกรรม (เปิด/ปิดรับสมัคร) — backend ตรวจสิทธิ์อาจารย์ให้ */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body as { id?: string; status?: string };

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    const activity = await apiFetch(`/activities/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    return toErrorResponse(error, 'Update activity status error');
  }
}
