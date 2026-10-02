import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { toErrorResponse } from '@/lib/routeErrors';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/** อนุมัติ / ไม่อนุมัติคำร้อง (เส้นเดิมที่หน้าอาจารย์บางจุดยังเรียกอยู่) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, status, rejectReason, approvedHours, approvedCategory } = body as {
      requestId?: string;
      status?: string;
      rejectReason?: string;
      approvedHours?: number;
      approvedCategory?: string;
    };

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: 'Missing requestId or status' }, { status: 400 });
    }

    const data =
      status === 'REJECTED'
        ? await apiFetch(`/hour-requests/${requestId}/reject`, {
            method: 'POST',
            body: { reason: rejectReason || 'ไม่ระบุเหตุผล' },
          })
        : await apiFetch(`/hour-requests/${requestId}/approve`, {
            method: 'POST',
            body: { approvedHours, approvedCategory },
          });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toErrorResponse(error, 'Approve Request Error');
  }
}
