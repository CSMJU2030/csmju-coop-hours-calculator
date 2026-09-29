import type { ActivityWithBadge } from '@/lib/queries';
import { ActivityBadgePill } from '@/components/ActivityBadgePill';
import { RegisterButton } from '@/components/RegisterButton';
import { formatHours, formatThaiDateTime } from '@/lib/utils';

function HourTag({ label, value }: { label: string; value: number }) {
  if (value <= 0) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-primary-dark">
      {label} {formatHours(value)} ชม.
    </span>
  );
}

export function ActivityCard({
  activity,
  registrationId,
}: {
  activity: ActivityWithBadge;
  registrationId?: string;
}) {
  return (
    <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-neutral">{activity.title}</h3>
          <ActivityBadgePill badge={activity.badge} />
        </div>
        <p className="text-sm text-slate-600">{activity.description}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>📍 {activity.location}</span>
          <span>🗓️ {formatThaiDateTime(activity.startTime)}</span>
          <span>ปิดรับสมัคร: {formatThaiDateTime(activity.registrationDeadline)}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <HourTag label="สหกิจ" value={activity.coopHours} />
          <HourTag label="จิตอาสา" value={activity.volunteerHours} />
          <HourTag label="สาขา" value={activity.majorHours} />
        </div>
      </div>

      <RegisterButton activityId={activity.id} registrationId={registrationId} badge={activity.badge} />
    </div>
  );
}
