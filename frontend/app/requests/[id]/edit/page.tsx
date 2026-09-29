import { notFound } from 'next/navigation';
import { requireIdentity, ForbiddenError } from '@/lib/auth';
import { getHourRequestById } from '@/lib/services/hourRequest';
import HourRequestForm from '@/components/HourRequestForm';

export const dynamic = 'force-dynamic';

export default async function EditRequestPage({ params }: { params: { id: string } }) {
  const identity = await requireIdentity();
  const request = await getHourRequestById(params.id);

  if (!request) notFound();
  if (request.coreUserId !== identity.userId) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์แก้ไขคำร้องนี้');
  }
  if (request.status !== 'REJECTED') {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">แก้ไขและยื่นคำร้องใหม่</h1>
        <p className="rounded-md bg-red-50 p-3 text-sm text-danger">
          <span className="font-medium">เหตุผลที่ถูกส่งกลับ:</span> {request.rejectionReason}
        </p>
      </div>
      <HourRequestForm
        requestId={request.id}
        initial={{
          title: request.title,
          category: request.category,
          hours: request.hours,
          proofUrl: request.proofUrl,
          description: request.description,
        }}
      />
    </div>
  );
}