import type { HourRequestStatus } from '@/lib/types';

const STYLES: Record<HourRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
};

const LABELS: Record<HourRequestStatus, string> = {
  PENDING: 'รอตรวจสอบ',
  PENDING_APPROVAL: 'รอตรวจสอบ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ/ส่งกลับ',
};

export default function RequestStatusBadge({ status }: { status: HourRequestStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status] || 'bg-slate-100 text-slate-800'}`}>
      {LABELS[status] || status}
    </span>
  );
}