'use server';

import { revalidatePath } from 'next/cache';
import { getIdentity, requireAdmin } from '@/lib/auth';
import { approveHourRequest } from '@/lib/services/hourRequest';

// ประกาศ Type สำหรับ ActionResult ให้พร้อมใช้งาน
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ฟังก์ชันดักจับ Error พื้นฐาน
function handleKnownErrors(err: unknown): ActionResult<never> {
  if (err instanceof Error) {
    return { success: false, error: err.message };
  }
  return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ' };
}

// Action สำหรับอนุมัติคำร้องแบบชุด (Batch Approve)
export async function batchApproveHourRequestsAction(
  requestIds: string[]
): Promise<ActionResult<{ approvedCount: number }>> {
  try {
    const identity = await getIdentity();
    requireAdmin(identity);

    if (!requestIds || requestIds.length === 0) {
      return { success: false, error: 'กรุณาเลือกรายการคำร้องอย่างน้อย 1 รายการ' };
    }

    // วนลูปอนุมัติทุกรายการที่ถูกเลือก
    for (const id of requestIds) {
      await approveHourRequest(identity, id);
    }

    // Revalidate แคชของหน้าเว็บเพื่อให้ข้อมูลอัปเดตทันที
    revalidatePath('/admin/requests');
    revalidatePath('/admin/students');

    return { success: true, data: { approvedCount: requestIds.length } };
  } catch (err) {
    return handleKnownErrors(err);
  }
}