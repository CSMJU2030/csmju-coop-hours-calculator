import { calculateCoopProgress, formatHours } from '@/lib/utils';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CoopProgress({ coopHoursEarned }: { coopHoursEarned: number }) {
  const progress = calculateCoopProgress(coopHoursEarned);
  const dashOffset = CIRCUMFERENCE - (progress.percentage / 100) * CIRCUMFERENCE;

  return (
    <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
          <circle cx="60" cy="60" r={RADIUS} fill="none" className="stroke-secondary" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            className={`transition-[stroke-dashoffset] duration-700 ease-out ${
              progress.eligible ? 'stroke-success' : 'stroke-primary'
            }`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-primary-dark">{progress.percentage}%</span>
          <span className="text-xs text-slate-500">
            {formatHours(progress.earned)} / {progress.goal} ชม.
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-primary-dark">ชั่วโมงสหกิจ (Co-op Hours)</h2>
          <p className="text-sm text-slate-500">เป้าหมาย {progress.goal} ชั่วโมง สำหรับยื่นสหกิจศึกษา</p>
        </div>

        {progress.eligible ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
            ✓ มีสิทธิ์ยื่นสหกิจศึกษา (Eligible for Co-op)
          </span>
        ) : (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-sm text-warning">
              ขาดอีก {formatHours(progress.missingHours)} ชั่วโมง ({progress.missingPercentage}%) จึงจะครบเกณฑ์
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function HourSummaryCards({
  volunteerHours,
  majorHours,
}: {
  volunteerHours: number;
  majorHours: number;
}) {
  const items = [
    { label: 'ชั่วโมงจิตอาสา', sub: 'Volunteer Hours', value: volunteerHours },
    { label: 'ชั่วโมงสาขา (ไม่ใช่สหกิจ)', sub: 'Major Non-Co-op Hours', value: majorHours },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="card p-5">
          <p className="text-sm font-medium text-neutral">{item.label}</p>
          <p className="text-xs text-slate-400">{item.sub}</p>
          <p className="mt-2 text-2xl font-bold text-primary-dark">
            {formatHours(item.value)} <span className="text-sm font-normal text-slate-400">ชม.</span>
          </p>
        </div>
      ))}
    </div>
  );
}
