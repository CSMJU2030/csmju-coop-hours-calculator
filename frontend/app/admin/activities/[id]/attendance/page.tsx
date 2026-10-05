import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireIdentity, requireAdmin } from '@/lib/auth';
import { getAttendanceRoster } from '@/lib/queries';
import { formatThaiDateTime } from '@/lib/utils';
import { AttendanceForm } from '@/components/AttendanceForm';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: { id: string } }) {
  const identity = await requireIdentity();
  requireAdmin(identity);

  const roster = await getAttendanceRoster(params.id);
  if (!roster) notFound();

  const { activity, seated, waiting } = roster;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">ยืนยันการเข้าร่วม: {activity.title}</h1>
          <p className="text-sm text-slate-500">
            {formatThaiDateTime(activity.startTime)} · {activity.location}
          </p>
        </div>
        <Link href={`/admin/activities/${activity.id}/print`} className="btn-secondary">
          พิมพ์ใบเซ็นชื่อ (A4)
        </Link>
      </div>

      <p className="rounded-md bg-secondary px-4 py-3 text-sm text-primary-dark">
        ทำเครื่องหมายจากใบเซ็นชื่อจริงของกิจกรรม — นักศึกษาที่ถูกเลือกจะได้รับสถานะ &quot;เข้าร่วม (ATTENDED)&quot; และได้รับชั่วโมงทันที
        ส่วนที่ไม่ได้เลือกจะถูกบันทึกเป็น &quot;ขาด (ABSENT)&quot;
      </p>

      <AttendanceForm activityId={activity.id} seated={seated} />

      {waiting.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-primary-dark">รายชื่อคิวสำรอง ({waiting.length}/5)</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-primary-dark">
                <tr>
                  <th className="px-4 py-3 font-medium">ลำดับคิว</th>
                  <th className="px-4 py-3 font-medium">รหัสนักศึกษา</th>
                  <th className="px-4 py-3 font-medium">ชื่อ-สกุล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waiting.map((row) => (
                  <tr key={row.registrationId}>
                    <td className="px-4 py-2.5 text-neutral">{row.queueNumber}</td>
                    <td className="px-4 py-2.5 text-neutral">{row.studentCode ?? '—'}</td>
                    <td className="px-4 py-2.5 text-neutral">{row.displayName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
