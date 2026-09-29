'use client';

import { useTransition, type ChangeEvent } from 'react';
import type { ActivityStatus } from '@/lib/types';
import { setActivityStatus } from '@/lib/actions/activity';

const OPTIONS: { value: ActivityStatus; label: string }[] = [
  { value: 'OPEN', label: 'เปิดรับสมัคร' },
  { value: 'CLOSED', label: 'ปิดรับสมัคร' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
];

export function StatusToggle({
  activityId,
  currentStatus,
}: {
  activityId: string;
  currentStatus: ActivityStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as ActivityStatus;
    startTransition(async () => {
      await setActivityStatus(activityId, status);
    });
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-neutral focus:border-primary focus:outline-none"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
