import Link from 'next/link';
import { requireIdentity } from '@/lib/auth';
import { listMyHourRequests } from '@/lib/services/hourRequest';
import { RequestHistoryTable } from '@/components/RequestHistoryTable';

export const dynamic = 'force-dynamic';

export default async function MyRequestsPage() {
  const identity = await requireIdentity();
  const requests = await listMyHourRequests(identity.userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">ประวัติคำร้องขอชั่วโมง</h1>
          <p className="text-sm text-slate-500">รายการคำร้องทั้งหมดที่คุณเคยยื่น</p>
        </div>
        <Link href="/requests/new" className="btn-primary">
          + ยื่นขอชั่วโมงกิจกรรม
        </Link>
      </div>

      <RequestHistoryTable requests={requests} />
    </div>
  );
}