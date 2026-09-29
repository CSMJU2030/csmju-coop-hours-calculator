import Link from 'next/link';
import { getPrintRoster } from '@/lib/queries';
import { formatThaiDate, formatThaiDateTime } from '@/lib/utils';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function PrintAttendanceSheetPage({ params }: { params: { id: string } }) {
  // ดึงรายชื่อผู้ลงทะเบียนผ่าน backend (frontend ต่อฐานข้อมูลตรงไม่ได้ — ARC-01)
  // ใช้ชุดข้อมูลเดียวกับหน้ายืนยันการเข้าร่วม ทำให้ใบเซ็นชื่อกับหน้าเช็คชื่อตรงกันเสมอ
  // (เดิมหน้านี้อ่านตาราง Participation ส่วนหน้าเช็คชื่ออ่าน Registration คนละตาราง
  //  รายชื่อสองหน้าจึงไม่ตรงกัน)
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

  const hourParts = [
    activity.hours > 0 ? `${activity.hours} ชั่วโมง` : null,
  ].filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link
          href="/admin/activities"
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          &larr; กลับหน้ารายการกิจกรรม
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet bg-white border border-slate-300 rounded-2xl mx-auto space-y-6 p-8 text-neutral shadow-xs">
        <header className="space-y-1 border-b border-slate-300 pb-4">
          <p className="text-xs text-slate-500">
            สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้ · ใบเซ็นชื่อเข้าร่วมกิจกรรม
          </p>
          <h1 className="text-xl font-bold text-slate-900">{activity.title}</h1>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2 pt-2">
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">วัน/เวลา:</dt>
              <dd>
                {formatThaiDateTime(activity.date)} – {formatThaiDate(activity.date)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">สถานที่:</dt>
              <dd>{activity.location || 'มหาวิทยาลัยแม่โจ้'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">ชั่วโมงที่ได้รับ:</dt>
              <dd>{hourParts.join(' · ') || `${activity.hours} ชั่วโมง`}</dd>
            </div>
          </dl>
        </header>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left bg-slate-50">
              <th className="w-10 py-2.5 px-2 text-center">ลำดับ</th>
              <th className="w-28 py-2.5 px-2">รหัส นศ.</th>
              <th className="py-2.5 px-2">ชื่อ-สกุล</th>
              <th className="w-28 py-2.5 px-2">ชั้นปี/สาขา</th>
              <th className="w-32 py-2.5 px-2 text-center">ช่องเซ็นชื่อเข้า</th>
              <th className="w-20 py-2.5 px-2">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {seated.map((row: any, i: number) => (
              <tr key={row.registrationId || i}>
                <td className="py-2.5 px-2 text-center">{i + 1}</td>
                <td className="py-2.5 px-2 font-mono font-medium">{row.username}</td>
                <td className="py-2.5 px-2">{row.displayName ?? ''}</td>
                <td className="py-2.5 px-2 text-slate-500">
                  {row.yearLevel ? `ปี ${row.yearLevel}` : ''} {row.major ?? ''}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-300">..............................</td>
                <td className="py-2.5 px-2">&nbsp;</td>
              </tr>
            ))}
            {seated.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  ยังไม่มีนักศึกษาลงทะเบียนในกิจกรรมนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <footer className="flex justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-400">
          <span>เอกสารสร้างโดยระบบ CSMJU Co-op Prep &amp; Activity Hours Tracking System</span>
          <span>พิมพ์เมื่อ {formatThaiDateTime(new Date())}</span>
        </footer>
      </div>
    </div>
  );
}