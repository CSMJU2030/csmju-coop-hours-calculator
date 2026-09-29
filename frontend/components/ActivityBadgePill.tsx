import type { ActivityBadge } from '@/lib/queries';

const STYLES: Record<ActivityBadge['kind'], string> = {
  REGISTERED: 'bg-success/10 text-success',
  WAITING: 'bg-amber-100 text-warning',
  AVAILABLE: 'bg-secondary text-primary-dark',
  WAITLIST_OPEN: 'bg-amber-50 text-warning',
  FULL: 'bg-red-50 text-danger',
  CLOSED: 'bg-slate-100 text-slate-500',
};

function label(badge: ActivityBadge): string {
  switch (badge.kind) {
    case 'REGISTERED':
      return '✓ ลงทะเบียนแล้ว';
    case 'WAITING':
      return `คิวสำรองที่ ${badge.queueNumber}/5`;
    case 'AVAILABLE':
      return `ว่าง ${badge.seatsLeft} ที่นั่ง`;
    case 'WAITLIST_OPEN':
      return `เต็ม — เหลือคิวสำรอง ${badge.spotsLeft}/5`;
    case 'FULL':
      return 'ที่นั่งและคิวสำรองเต็มแล้ว';
    case 'CLOSED':
      return 'ปิดรับสมัครแล้ว';
  }
}

export function ActivityBadgePill({ badge }: { badge: ActivityBadge }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STYLES[badge.kind]}`}>
      {label(badge)}
    </span>
  );
}
