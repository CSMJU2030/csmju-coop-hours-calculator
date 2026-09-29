import { z } from 'zod';
import { getIdentity, requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/auth';
import { rejectHourRequest, HourRequestNotFoundError, HourRequestStateError } from '@/lib/services/hourRequest';
import { envelope, envelopeError } from '@/lib/apiEnvelope';

const bodySchema = z.object({
  reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลที่ปฏิเสธหรือส่งกลับแก้ไข'),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const identity = await getIdentity();
    requireAdmin(identity);

    const { reason } = bodySchema.parse(await request.json());
    const updated = await rejectHourRequest(identity, params.id, reason);
    return envelope(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return envelopeError(err.message, 401);
    if (err instanceof ForbiddenError) return envelopeError(err.message, 403);
    if (err instanceof HourRequestNotFoundError) return envelopeError(err.message, 404);
    if (err instanceof HourRequestStateError) return envelopeError(err.message, 409);
    if (err instanceof z.ZodError) return envelopeError(err.errors.map((e) => e.message).join(', '), 400);
    console.error('[csmju-coop-hours-calculator] POST /api/requests/[id]/reject error:', err);
    return envelopeError('เกิดข้อผิดพลาดที่ไม่คาดคิด', 500);
  }
}