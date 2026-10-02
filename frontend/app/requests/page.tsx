import Link from 'next/link';
import { PageBanner, bannerButtonClass } from '@/components/PageBanner';
import { requireIdentity } from '@/lib/auth';
import { listMyHourRequests } from '@/lib/services/hourRequest';
import { RequestHistoryTable } from '@/components/RequestHistoryTable';

export const dynamic = 'force-dynamic';

export default async function MyRequestsPage() {
  const identity = await requireIdentity();
  const requests = await listMyHourRequests(identity.userId);

  return (
    <div className="space-y-6">
      <PageBanner
        compact
        eyebrow="นักศึกษา"
        title="ประวัติคำร้องขอชั่วโมง"
        subtitle="รายการคำร้องทั้งหมดที่คุณเคยยื่น"
        actions={
          <Link href="/requests/new" className={bannerButtonClass}>
            <span className="text-lg leading-none">+</span>
            <span>ยื่นขอชั่วโมงกิจกรรม</span>
          </Link>
        }
      />

      <RequestHistoryTable requests={requests} />
    </div>
  );
}