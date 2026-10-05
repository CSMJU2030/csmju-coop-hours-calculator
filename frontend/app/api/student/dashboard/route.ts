import { NextResponse } from 'next/server';
import { ApiError, UnauthenticatedError, apiFetch, getMyProfileOrNull } from '@/lib/api';
import { activityCategoryLabel, formatActivityTime } from '@/lib/activityLabels';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/**
 * ข้อมูลตั้งต้นของหน้า dashboard นักศึกษา
 *
 * เดิม route นี้อ่านฐานข้อมูลตรง ๆ และใช้รหัสนักศึกษาที่ hardcode ไว้ (ค่าคงที่)
 * ทำให้ทุกคนเห็นข้อมูลของคนคนเดียวกัน ตอนนี้ยิงไป backend ซึ่งรู้ว่าใครเรียกจาก token
 * รูปแบบข้อมูลที่ส่งกลับไปให้หน้าเว็บยังเหมือนเดิมทุก field หน้า dashboard จึงไม่ต้องแก้
 */

interface DashboardPayload {
  hourRequests: Array<{
    id: string;
    dateStr: string | null;
    timeStr: string | null;
    title: string;
    typeCategory: string | null;
    type: string | null;
    status: string;
    statusText: string | null;
    hours: number;
    approvedHours: number | null;
    approvedCategory: string | null;
    rejectionReason: string | null;
    imageProof: string | null;
    note: string | null;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    title: string;
    category: string;
    startTime: string;
    endTime: string;
    hours: number;
    coopHours: number;
    volunteerHours: number;
    majorHours: number;
    location: string;
    capacity: number;
    registeredCount: number;
    status: string;
  }>;
  registeredActivityIds: string[];
  summary: { coopHours: number; volunteerHours: number; majorHours: number };
}

export async function GET(request: Request) {
  // ?lite=1: หน้านักศึกษาถามซ้ำทุก 5 วินาทีเพื่อให้ชั่วโมงขึ้นทันที จึงไม่ถามชื่อจาก Core Hub ซ้ำทุกรอบ
  const lite = new URL(request.url).searchParams.get('lite') === '1';

  try {
    const [dashboard, profile] = await Promise.all([
      apiFetch<DashboardPayload>('/me/dashboard'),
      lite ? Promise.resolve(null) : getMyProfileOrNull(),
    ]);

    const activities = dashboard.hourRequests.map((req) => ({
      id: req.id,
      dateStr: req.dateStr ?? new Date(req.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      timeStr: req.timeStr || '09:00 - 16:00',
      title: req.title,
      categoryTarget: req.typeCategory === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
      typeDetail: req.type,
      status: req.status,
      statusText: req.statusText || (req.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'),
      hours: req.hours,
      approvedHours: req.approvedHours ?? req.hours,
      approvedCategory: req.approvedCategory as 'COOP' | 'VOLUNTEER' | undefined,
      typeCategory: req.typeCategory,
      reason: req.rejectionReason || undefined,
      imageProof: req.imageProof || undefined,
      note: req.note || undefined,
    }));

    const publishedList = dashboard.activities.map((act) => ({
      id: act.id,
      title: act.title,
      category: activityCategoryLabel(act),
      dateStr: new Date(act.startTime).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      timeStr: formatActivityTime(act.startTime, act.endTime),
      location: act.location || 'คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
      hours: act.hours,
      capacity: act.capacity,
      registeredCount: act.registeredCount,
      status: act.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
    }));

    return NextResponse.json({
      success: true,
      activities,
      publishedList,
      registeredIds: dashboard.registeredActivityIds,
      summary: dashboard.summary,
      student: lite ? undefined : { displayName: profile?.displayName ?? null, personCode: profile?.personCode ?? null },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('API Dashboard Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
