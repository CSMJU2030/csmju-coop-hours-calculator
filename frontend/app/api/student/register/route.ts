import { NextResponse } from 'next/server';
import { ApiError, UnauthenticatedError, apiFetch } from '@/lib/api';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/**
 * ลงทะเบียน / ยกเลิกกิจกรรมของหลักสูตร (เรียกจากหน้า dashboard)
 *
 * เดิม route นี้ทำ 2 อย่างพร้อมกัน: สร้างแถว Participation และสร้าง HourRequest
 * ที่ "อนุมัติแล้ว" ให้ทันทีตั้งแต่ตอนกดลงทะเบียน ซึ่งชนกับการให้ชั่วโมงตอนอาจารย์
 * ยืนยันการเข้าร่วม ทำให้ได้ชั่วโมงซ้ำสองรอบ และได้ชั่วโมงแม้ไม่ได้ไปจริง
 *
 * ตอนนี้ลงทะเบียนคือลงทะเบียนอย่างเดียว ชั่วโมงจะถูกให้ตอนอาจารย์ยืนยันการเข้าร่วม
 * ที่หน้า /admin/activities/[id]/attendance ตามที่ระบบออกแบบไว้แต่แรก
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId, action } = body as { activityId?: string; action?: 'REGISTER' | 'CANCEL' };

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'Missing activityId' }, { status: 400 });
    }

    if (action === 'CANCEL') {
      // หา registration ของตัวเองสำหรับกิจกรรมนี้ก่อน แล้วค่อยยกเลิกด้วย id
      const mine = await apiFetch<Array<{ id: string; activityId: string }>>('/registrations/me');
      const target = mine.find((r) => r.activityId === activityId);

      if (!target) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบการลงทะเบียนของคุณสำหรับกิจกรรมนี้' },
          { status: 404 },
        );
      }

      await apiFetch(`/registrations/${target.id}`, { method: 'DELETE' });
      return NextResponse.json({ success: true });
    }

    await apiFetch('/registrations', { method: 'POST', body: { activityId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('=== API REGISTER ERROR ===', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
