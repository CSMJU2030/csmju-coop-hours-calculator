import Image from 'next/image';
import Link from 'next/link';
import { getPrintRoster } from '@/lib/queries';
import { formatThaiDate, formatThaiDateTime } from '@/lib/utils';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const timeFormat = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Bangkok',
});

/** กิจกรรมเก่าที่สร้างก่อนมีช่องอาจารย์ผู้รับผิดชอบจะเก็บเป็น "-" — ถือว่าไม่ระบุ */
function cleanName(value: string | null | undefined): string | null {
  const name = (value ?? '').trim();
  return name && name !== '-' ? name : null;
}

export default async function PrintAttendanceSheetPage({ params }: { params: { id: string } }) {
  // ดึงรายชื่อผู้ลงทะเบียนผ่าน backend (frontend ต่อฐานข้อมูลตรงไม่ได้ — ARC-01)
  // ใช้ชุดข้อมูลเดียวกับหน้ายืนยันการเข้าร่วม ใบเซ็นชื่อกับหน้าเช็คชื่อจึงตรงกันเสมอ
  // รายชื่อมีเฉพาะนักศึกษาที่ลงทะเบียนกิจกรรมนี้ไว้ (ไม่รวมคนที่ยกเลิกและคนในคิวสำรอง)
  const roster = await getPrintRoster(params.id);

  if (!roster) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">ไม่พบข้อมูลกิจกรรมนี้ในระบบฐานข้อมูล</h1>
        <Link href="/admin/activities" className="text-blue-600 underline text-sm">
          กลับสู่หน้ารายการกิจกรรม
        </Link>
      </div>
    );
  }

  const { activity, seated } = roster;
  const lecturer = cleanName(activity.lecturerInCharge);

  // เรียงตามรหัสนักศึกษา ให้หาชื่อตัวเองบนกระดาษได้ง่าย (คนที่ยังไม่มีรหัสไว้ท้ายสุด)
  const rows = [...seated].sort((a, b) => {
    if (a.studentCode && b.studentCode) return a.studentCode.localeCompare(b.studentCode);
    if (a.studentCode) return -1;
    if (b.studentCode) return 1;
    return 0;
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link href="/admin/activities" className="text-xs font-bold text-slate-500 hover:text-slate-800">
          &larr; กลับหน้ารายการกิจกรรม
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet bg-white border border-slate-300 rounded-2xl mx-auto space-y-5 p-8 text-neutral shadow-xs">
        {/* หัวกระดาษ */}
        <header className="print-keep space-y-4 border-b-2 border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="สาขาวิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้"
              width={96}
              height={68}
              priority
              className="h-[68px] w-auto shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-base font-bold text-slate-900">ใบเซ็นชื่อเข้าร่วมกิจกรรม</p>
              <p className="text-xs text-slate-600">
                สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้
              </p>
              <p className="text-[11px] text-slate-400">Computer Science, Maejo University</p>
            </div>
          </div>

          <h1 className="text-lg font-bold leading-snug text-slate-900">{activity.title}</h1>

          <dl className="grid grid-cols-1 gap-x-8 gap-y-1.5 text-xs sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-slate-500">วันที่:</dt>
              <dd>{formatThaiDate(activity.date)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-slate-500">เวลา:</dt>
              <dd>
                {timeFormat.format(activity.startTime)} – {timeFormat.format(activity.endTime)} น.
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-slate-500">สถานที่:</dt>
              <dd>{activity.location || 'มหาวิทยาลัยแม่โจ้'}</dd>
            </div>
            {lecturer && (
              <div className="flex gap-2">
                <dt className="shrink-0 font-bold text-slate-500">อาจารย์ผู้รับผิดชอบ:</dt>
                <dd>{lecturer}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-slate-500">ผู้ลงทะเบียน:</dt>
              <dd>
                {rows.length} คน (รับสูงสุด {activity.capacity} คน)
              </dd>
            </div>
          </dl>
        </header>

        {/* รายชื่อ */}
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 bg-slate-50 text-left">
              <th className="w-10 px-2 py-2.5 text-center">ลำดับ</th>
              <th className="w-28 px-2 py-2.5">รหัสนักศึกษา</th>
              <th className="px-2 py-2.5">ชื่อ-สกุล</th>
              <th className="w-32 px-2 py-2.5">ชั้นปี/สาขา</th>
              <th className="w-40 px-2 py-2.5 text-center">ลายมือชื่อ</th>
              <th className="w-20 px-2 py-2.5">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {rows.map((row, i) => (
              <tr key={row.registrationId}>
                <td className="px-2 py-3 text-center">{i + 1}</td>
                <td className="px-2 py-3 font-mono font-medium">{row.studentCode ?? ''}</td>
                <td className="px-2 py-3">{row.displayName ?? ''}</td>
                <td className="px-2 py-3 text-slate-500">
                  {row.yearLevel ? `ปี ${row.yearLevel}` : ''} {row.major ?? ''}
                </td>
                <td className="px-2 py-3 text-center text-slate-300">..............................</td>
                <td className="px-2 py-3">&nbsp;</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  ยังไม่มีนักศึกษาลงทะเบียนในกิจกรรมนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <footer className="print-keep flex justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-400">
          <span>เอกสารสร้างโดยระบบติดตามชั่วโมงสหกิจและกิจกรรม CSMJU2030</span>
          <span>พิมพ์เมื่อ {formatThaiDateTime(new Date())}</span>
        </footer>
      </div>
    </div>
  );
}
