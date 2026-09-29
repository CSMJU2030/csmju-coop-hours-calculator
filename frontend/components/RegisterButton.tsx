'use client';

import { useState, useTransition } from 'react';
import { registerActivity, cancelRegistration } from '@/lib/actions/activity';
import type { ActivityBadge } from '@/lib/queries';

export function RegisterButton({
  activityId,
  registrationId,
  badge,
}: {
  activityId: string;
  registrationId?: string;
  badge: ActivityBadge;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isMine = badge.kind === 'REGISTERED' || badge.kind === 'WAITING';
  const canRegister = badge.kind === 'AVAILABLE' || badge.kind === 'WAITLIST_OPEN';

  function handleRegister() {
    setError(null);
    startTransition(async () => {
      const result = await registerActivity(activityId);
      if (!result.success) setError(result.error);
    });
  }

  function handleCancel() {
    if (!registrationId) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelRegistration(registrationId);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isMine ? (
        <button onClick={handleCancel} disabled={isPending} className="btn-danger">
          {isPending ? 'กำลังยกเลิก…' : 'ยกเลิกการลงทะเบียน'}
        </button>
      ) : (
        <button onClick={handleRegister} disabled={isPending || !canRegister} className="btn-primary">
          {isPending
            ? 'กำลังลงทะเบียน…'
            : badge.kind === 'WAITLIST_OPEN'
              ? 'ลงชื่อในคิวสำรอง'
              : 'ลงทะเบียน'}
        </button>
      )}
      {error && <p className="max-w-[220px] text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
