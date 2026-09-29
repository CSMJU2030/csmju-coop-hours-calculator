import { requireIdentity, requireAdmin } from '@/lib/auth';
import { getAllStudentsSummary } from '@/lib/queries';
import { formatHours } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const identity = await requireIdentity();
  requireAdmin(identity);

  const students = await getAllStudentsSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">สรุปรายชื่อนักศึกษา</h1>
        <p className="text-sm text-slate-500">ชั่วโมงสะสมของนักศึกษาทุกคนในระบบ ({students.length} คน)</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary text-primary-dark">
            <tr>
              <th className="px-4 py-3 font-medium">รหัสนักศึกษา</th>
              <th className="px-4 py-3 font-medium">ชื่อ-สกุล</th>
              <th className="px-4 py-3 font-medium">ชั้นปี/สาขา</th>
              <th className="px-4 py-3 font-medium">สหกิจ (เป้าหมาย 15)</th>
              <th className="px-4 py-3 font-medium">จิตอาสา</th>
              <th className="px-4 py-3 font-medium">สาขา</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.username}>
                <td className="px-4 py-3 text-neutral">{s.username}</td>
                <td className="px-4 py-3 text-neutral">{s.displayName ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {s.yearLevel ? `ปี ${s.yearLevel}` : '—'} / {s.major ?? '—'}
                </td>
                <td className="px-4 py-3 text-neutral">
                  {formatHours(s.coopHours)} / 15 ชม.
                </td>
                <td className="px-4 py-3 text-neutral">{formatHours(s.volunteerHours)} ชม.</td>
                <td className="px-4 py-3 text-neutral">{formatHours(s.majorHours)} ชม.</td>
                <td className="px-4 py-3">
                  {s.eligible ? (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                      ✓ มีสิทธิ์ยื่นสหกิจ
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      ยังไม่ครบ
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  ยังไม่มีนักศึกษาในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}