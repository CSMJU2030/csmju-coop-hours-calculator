import { getIdentity, requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/auth';
import { approveHourRequest, HourRequestNotFoundError, HourRequestStateError } from '@/lib/services/hourRequest';
import { envelope, envelopeError } from '@/lib/apiEnvelope';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const identity = await getIdentity();
    requireAdmin(identity);

    const updated = await approveHourRequest(identity, params.id);
    return envelope(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return envelopeError(err.message, 401);
    if (err instanceof ForbiddenError) return envelopeError(err.message, 403);
    if (err instanceof HourRequestNotFoundError) return envelopeError(err.message, 404);
    if (err instanceof HourRequestStateError) return envelopeError(err.message, 409);
    console.error('[csmju-coop-hours-calculator] POST /api/requests/[id]/approve error:', err);
    return envelopeError('เกิดข้อผิดพลาดที่ไม่คาดคิด', 500);
  }
}