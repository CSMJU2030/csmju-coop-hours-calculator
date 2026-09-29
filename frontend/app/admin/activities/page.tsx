'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface PublishedActivity {
  id: string;
  title: string;
  category: string;
  dateStr: string;
  timeStr?: string;
  location: string;
  hours: number;
  capacity: number;
  registeredCount?: number;
  status: 'OPEN' | 'CLOSED';
}

export default function AdminActivitiesPage() {
  const [publishedList, setPublishedList] = useState<PublishedActivity[]>([]);

  // โหลดข้อมูลจาก Database โดยตรง
  const loadActivities = async () => {
    try {
      const res = await fetch('/api/admin/activities', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.activities && Array.isArray(data.activities)) {
          const mapped = data.activities.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.activityType || 'ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)',
            dateStr: new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
            timeStr: `${item.startTime || '09:00'} - ${item.endTime || '16:00'} น.`,
            location: item.location || 'มหาวิทยาลัยแม่โจ้',
            hours: item.hours,
            capacity: item.capacity,
            status: item.status || 'OPEN',
          }));
          setPublishedList(mapped);
        }
      }
    } catch (err) {
      console.error('API fetch activities failed:', err);
    }
  };

  useEffect(() => {
    loadActivities();
    window.addEventListener('csmju_activity_updated', loadActivities);
    return () => window.removeEventListener('csmju_activity_updated', loadActivities);
  }, []);

  const handleToggleStatus = async (id: string) => {
    const activity = publishedList.find((a) => a.id === id);
    if (!activity) return;

    const newStatus: 'OPEN' | 'CLOSED' = activity.status === 'OPEN' ? 'CLOSED' : 'OPEN';

    // 1. อัปเดต State หน้า Admin ทันที (Optimistic Update)
    setPublishedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    // 2. ยิง API เพื่อบันทึกการเปลี่ยนสถานะในฐานข้อมูล
    try {
      const res = await fetch('/api/admin/activities/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        // แจ้งเตือนหน้า Dashboard และแท็บอื่นให้รีโหลดข้อมูลใหม่ทันที
        window.dispatchEvent(new Event('csmju_activity_updated'));
        localStorage.setItem('csmju_activity_sync', Date.now().toString());
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะในฐานข้อมูล');
        loadActivities(); // คืนค่าเดิมถ้า API ล้มเหลว
      }
    } catch (e) {
      console.error('Failed to update status in DB', e);
      loadActivities();
    }
  };

  // ฟังก์ชันลบกิจกรรม โดยยิง API ไปลบที่ฐานข้อมูลจริง
  const handleDeleteActivity = async (act: PublishedActivity) => {
    if (!confirm(`คุณต้องการลบกิจกรรม "${act.title}" ออกจากระบบถาวร ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/admin/activities?id=${act.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        alert('เกิดข้อผิดพลาดในการลบข้อมูลจากฐานข้อมูล');
        return;
      }

      const updatedList = publishedList.filter((item) => item.id !== act.id);
      setPublishedList(updatedList);

      window.dispatchEvent(new Event('csmju_activity_updated'));
      window.dispatchEvent(new Event('csmju_hours_updated'));
      localStorage.setItem('csmju_activity_sync', Date.now().toString());

      alert('ลบกิจกรรมออกจากฐานข้อมูลเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Delete activity failed:', err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบข้อมูลได้');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การจัดการกิจกรรมของหลักสูตร</h1>
          <p className="text-xs text-slate-500 mt-1">
            รายการกิจกรรมทั้งหมดที่เปิดให้นักศึกษาลงทะเบียน พร้อมระบบพิมพ์ใบเซ็นชื่อ
          </p>
        </div>
        <Link
          href="/admin/activities/new"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md transition cursor-pointer"
        >
          + ประกาศกิจกรรมใหม่
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-bold">ชื่องานกิจกรรม</th>
                <th className="p-4 font-bold">หมวดหมู่</th>
                <th className="p-4 font-bold">ชั่วโมง</th>
                <th className="p-4 font-bold">วันที่ / สถานที่</th>
                <th className="p-4 font-bold">สถานะรับสมัคร</th>
                <th className="p-4 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {publishedList.map((act) => {
                const isOpen = act.status === 'OPEN';
                return (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 leading-snug">{act.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">รหัสอ้างอิง: {act.id}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {act.category}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-blue-600">{act.hours} ชม.</td>
                    <td className="p-4 text-slate-600">
                      <p className="font-bold">{act.dateStr}</p>
                      <p className="text-[11px] text-slate-400">{act.location}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {isOpen ? 'กำลังเปิดรับ' : 'ปิดรับแล้ว'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/activities/${act.id}/print`}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition shadow-xs inline-flex items-center gap-1.5"
                        >
                          🖨️ พิมพ์ใบเซ็นชื่อ
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(act.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                            isOpen
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOpen ? 'ปิดรับ' : 'เปิดรับ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {publishedList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    ยังไม่มีกิจกรรมที่ประกาศในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}