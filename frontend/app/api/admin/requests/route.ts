import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { toErrorResponse } from '@/lib/routeErrors';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/**
 * คำร้องทั้งหมดสำหรับหน้าตรวจของอาจารย์
 *
 * หมายเหตุ: หน้าเดิมอ่านชื่อนักศึกษาจาก field ชื่อ `UserProfile` (ตัวใหญ่) แต่ API
 * ส่ง `userProfile` (ตัวเล็ก) มาให้ ชื่อนักศึกษาจึงไม่เคยแสดงเลย — ที่นี่แนบมาให้
 * ทั้งสองชื่อ เพื่อให้หน้าเดิมแสดงชื่อได้โดยไม่ต้องแก้หน้าเว็บ
 */

interface ApiHourRequest {
  id: string;
  studentCode: string | null;
  studentName: string;
  userProfile?: { displayName: string | null; fullName: string | null; studentCode: string | null } | null;
}

export async function GET() {
  try {
    const requests = await apiFetch<ApiHourRequest[]>('/hour-requests?page=1&limit=100');

    const withProfile = requests.map((req) => {
      const profile = {
        fullName: req.userProfile?.fullName ?? req.userProfile?.displayName ?? req.studentName,
        studentCode: req.userProfile?.studentCode ?? req.studentCode,
      };
      return { ...req, userProfile: profile, UserProfile: profile };
    });

    return NextResponse.json({ success: true, requests: withProfile });
  } catch (error) {
    return toErrorResponse(error, 'Admin Get Requests Error');
  }
}

/** อนุมัติ / ไม่อนุมัติคำร้อง */
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
    return toErrorResponse(error, 'Admin Approve Request Error');
  }
}
