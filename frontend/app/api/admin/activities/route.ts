import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { toErrorResponse } from '@/lib/routeErrors';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/** กิจกรรมสำหรับหน้าอาจารย์ — backend ตรวจสิทธิ์ให้แล้ว (นักศึกษาสร้าง/ลบไม่ได้) */

interface ApiActivity {
  id: string;
  title: string;
  description: string;
  location: string;
  activityType: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  hours: number;
  status: string;
  createdAt: string;
}

export async function GET() {
  try {
    const activities = await apiFetch<ApiActivity[]>('/activities?page=1&limit=200');
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    // หน้า list เดิมคาดหวัง activities:[] เสมอเมื่อพลาด จึงไม่โยน error ออกไป
    console.error('Get Activities API Error:', error);
    return NextResponse.json({ success: false, activities: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, hours, dateStr, timeStr, location, capacity } =
      body as Record<string, string | number | undefined>;

    let activityDate = new Date();
    if (typeof dateStr === 'string' && dateStr.includes('-') && dateStr.length === 10) {
      activityDate = new Date(dateStr);
    }
    if (Number.isNaN(activityDate.getTime())) {
      activityDate = new Date();
    }

    const startDateTime = new Date(activityDate);
    const endDateTime = new Date(activityDate);

    if (typeof timeStr === 'string' && timeStr.includes('-')) {
      const [rawStart = '', rawEnd = ''] = timeStr.split('-');
      const startParts = rawStart.trim().replace(' น.', '').split(':');
      const endParts = rawEnd.trim().replace(' น.', '').split(':');

      if (startParts.length === 2) {
        startDateTime.setHours(Number(startParts[0]), Number(startParts[1]), 0, 0);
      }
      if (endParts.length === 2) {
        endDateTime.setHours(Number(endParts[0]), Number(endParts[1]), 0, 0);
      }
    }

    // backend บังคับให้เวลาสิ้นสุดอยู่หลังเวลาเริ่ม — กันกรณีฟอร์มไม่ได้กรอกช่วงเวลา
    if (endDateTime <= startDateTime) {
      endDateTime.setTime(startDateTime.getTime() + 60 * 60 * 1000);
    }

    const activityHours = Number(hours) || 1;
    const isCoop = String(category ?? '').includes('สหกิจ') || String(category ?? '').includes('วิชาชีพ');

    const created = await apiFetch('/activities', {
      method: 'POST',
      body: {
        title: String(title || 'ไม่มีชื่อกิจกรรม'),
        description: String(description || '-'),
        location: String(location || 'คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้'),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        registrationDeadline: startDateTime.toISOString(),
        capacity: Number(capacity) || 30,
        lecturerInCharge: '-',
        coopHours: isCoop ? activityHours : 0,
        volunteerHours: isCoop ? 0 : activityHours,
        majorHours: 0,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return toErrorResponse(error, '=== CREATE ACTIVITY API ERROR ===');
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing activity ID' }, { status: 400 });
    }

    // การลบข้อมูลลูก (registrations / hour_requests ของกิจกรรมนี้) ทำโดยฐานข้อมูล
    // ผ่าน onDelete: Cascade — ไม่ต้องไล่ลบเองทีละตารางเหมือนเดิมแล้ว
    await apiFetch(`/activities/${id}`, { method: 'DELETE' });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error, 'Delete Activity API Error');
  }
}
