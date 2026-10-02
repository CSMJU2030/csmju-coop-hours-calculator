import { NextResponse } from 'next/server';
import { ApiError, UnauthenticatedError, apiFetch } from '@/lib/api';

/** ใช้คุกกี้ผู้ใช้ จึง prerender ตอน build ไม่ได้ */
export const dynamic = 'force-dynamic';

/**
 * คำร้องขอนับชั่วโมงของนักศึกษาที่ login อยู่ (เรียกจากหน้า /requests/new และ dashboard)
 *
 * เดิม route นี้ใช้รหัสนักศึกษาที่ hardcode ไว้ (ค่าคงที่) ทั้งตอนบันทึกและตอนอ่าน
 * ทำให้คำร้องของทุกคนไปกองรวมกันที่บัญชีเดียว ตอนนี้ backend เป็นคนตัดสินจาก token
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, categoryTarget, typeDetail, hours, imageProof, note } = body as Record<string, unknown>;

    if (!title || !hours) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const created = await apiFetch('/hour-requests', {
      method: 'POST',
      body: {
        title: String(title),
        category: categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
        hours: Number(hours),
        description: [typeDetail, note].filter(Boolean).join(' — ') || null,
        proofUrl: imageProof ? String(imageProof) : null,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('API Hour Request Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/** ฟังก์ชัน GET เพื่อให้หน้าเว็บดึงประวัติมาแสดงได้ */
export async function GET() {
  try {
    const requests = await apiFetch('/hour-requests/me');
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ success: true, data: [] });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('API Get Requests Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
