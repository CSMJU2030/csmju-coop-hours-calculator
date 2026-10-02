import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { toErrorResponse } from '@/lib/routeErrors';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/**
 * คำร้องขอนับชั่วโมงของนักศึกษาที่ login อยู่
 *
 * เดิม route นี้ใช้รหัสนักศึกษาที่ hardcode ไว้ (ค่าคงที่) ทั้งตอนบันทึกและตอนอ่าน
 * และ DELETE ไม่ตรวจว่าเป็นเจ้าของคำร้องหรือไม่ — ใครรู้ id ก็ลบของคนอื่นได้
 * ตอนนี้ backend เป็นคนตัดสินจาก token และตรวจความเป็นเจ้าของให้ทุกครั้ง
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, categoryTarget, hours, proofUrl, description } = body as Record<string, unknown>;

    const created = await apiFetch('/hour-requests', {
      method: 'POST',
      body: {
        title: String(title || 'ยื่นขอชั่วโมงกิจกรรม'),
        category:
          categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : categoryTarget === 'MAJOR' ? 'MAJOR' : 'COOP',
        hours: Number(hours) || 1,
        proofUrl: proofUrl ? String(proofUrl) : null,
        description: description ? String(description) : null,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return toErrorResponse(error, 'API Hour Request Error');
  }
}

export async function GET() {
  try {
    const requests = await apiFetch('/hour-requests/me');
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return toErrorResponse(error, 'API Get Requests Error');
  }
}

/**
 * แก้ไขคำร้องที่ถูกปฏิเสธแล้วยื่นใหม่
 * เดิมหน้า HourRequestForm ยิง PUT มาที่นี่ แต่ route ไม่เคยมีฟังก์ชัน PUT
 * ทำให้หน้าแก้ไขคำร้องได้ 405 ทุกครั้ง — เพิ่มให้ครบแล้ว
 */
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing request ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, categoryTarget, hours, proofUrl, description } = body as Record<string, unknown>;

    const updated = await apiFetch(`/hour-requests/${id}`, {
      method: 'PATCH',
      body: {
        title: String(title || 'ยื่นขอชั่วโมงกิจกรรม'),
        category:
          categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : categoryTarget === 'MAJOR' ? 'MAJOR' : 'COOP',
        hours: Number(hours) || 1,
        proofUrl: proofUrl ? String(proofUrl) : null,
        description: description ? String(description) : null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return toErrorResponse(error, 'API Update Request Error');
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing request ID' }, { status: 400 });
    }

    await apiFetch(`/hour-requests/${id}`, { method: 'DELETE' });
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return toErrorResponse(error, 'API Delete Request Error');
  }
}
