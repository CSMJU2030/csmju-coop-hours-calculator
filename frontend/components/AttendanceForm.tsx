'use client';

import { useMemo, useState, useTransition } from 'react';
import { batchConfirmAttendance } from '@/lib/actions/activity';
import type { AttendanceRow } from '@/lib/queries';

export function AttendanceForm({ activityId, seated }: { activityId: string; seated: AttendanceRow[] }) {
  const initiallyChecked = useMemo(
    () => new Set(seated.filter((r) => r.status !== 'ABSENT').map((r) => r.username)),
    [seated]
  );
  const [checked, setChecked] = useState<Set<string>>(initiallyChecked);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ attended: number; absent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(username: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  function selectAll() {
    setChecked(new Set(seated.map((r) => r.username)));
  }

  function clearAll() {
    setChecked(new Set());
  }

  function handleConfirm() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await batchConfirmAttendance(activityId, Array.from(checked));
      if (!res.success) {
        setError(res.error);
        return;
      }
      setResult(res.data);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <button onClick={selectAll} className="btn-secondary">
            เลือกทั้งหมด
          </button>
          <button onClick={clearAll} className="btn-secondary">
            ล้างการเลือก
          </button>
        </div>
        <p className="text-sm text-slate-500">
          เลือกแล้ว {checked.size} / {seated.length} คน
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary text-primary-dark">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 font-medium">รหัสนักศึกษา</th>
              <th className="px-4 py-3 font-medium">ชื่อ-สกุล</th>
              <th className="px-4 py-3 font-medium">ชั้นปี/สาขา</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {seated.map((row) => (
              <tr key={row.registrationId} className={checked.has(row.username) ? '' : 'bg-slate-50/60'}>
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={checked.has(row.username)}
                    onChange={() => toggle(row.username)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-2.5 text-neutral">{row.username}</td>
                <td className="px-4 py-2.5 text-neutral">{row.displayName ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {row.yearLevel ? `ปี ${row.yearLevel}` : '—'} / {row.major ?? '—'}
                </td>
              </tr>
            ))}
            {seated.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  ยังไม่มีผู้ลงทะเบียนที่ได้ที่นั่ง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {result && (
        <p className="text-sm text-success">
          บันทึกสำเร็จ: มาเข้าร่วม {result.attended} คน, ขาด {result.absent} คน — ระบบเครดิตชั่วโมงให้อัตโนมัติแล้ว
        </p>
      )}

      <div className="flex justify-end">
        <button onClick={handleConfirm} disabled={isPending || seated.length === 0} className="btn-primary">
          {isPending ? 'กำลังบันทึก…' : 'ยืนยันการเข้าร่วมและเครดิตชั่วโมง'}
        </button>
      </div>
    </div>
  );
}
