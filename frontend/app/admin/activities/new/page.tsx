'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateActivityPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)' | 'ชั่วโมงจิตอาสา'>('ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)');
  const [hours, setHours] = useState('3');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [location, setLocation] = useState('ห้องปฏิบัติการคอมพิวเตอร์ คณะวิทยาศาสตร์ แม่โจ้');
  const [capacity, setCapacity] = useState('40');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // ส่งวันที่แบบ YYYY-MM-DD ตรงๆ ไปให้ API เพื่อให้ Prisma แปลงเป็น DateTime ได้อย่างถูกต้องแม่นยำ
    const rawDate = dateStr || new Date().toISOString().split('T')[0];
    const timeStr = `${startTime} - ${endTime} น.`;

    const activityData = {
      title,
      description,
      category,
      hours: Number(hours) || 1,
      dateStr: rawDate,
      timeStr,
      location,
      capacity: Number(capacity) || 30,
    };

    try {
      // บันทึกลงฐานข้อมูลจริงผ่าน API
      const res = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // สำรองเก็บบันทึกลง localStorage ไว้แสดงผลร่วมด้วย
        const saved = localStorage.getItem('csmju_published_activities');
        const current = saved ? JSON.parse(saved) : [];
        const newLocalActivity = { id: `act-${Date.now()}`, ...activityData, registeredCount: 0, status: 'OPEN' };
        localStorage.setItem('csmju_published_activities', JSON.stringify([newLocalActivity, ...current]));

        window.dispatchEvent(new Event('csmju_activity_updated'));

        alert('ประกาศกิจกรรมใหม่ลงฐานข้อมูลสำเร็จ!');
        router.push('/admin/activities');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล: ' + (result.error || ''));
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ประกาศกิจกรรมใหม่</h1>
          <p className="text-xs text-slate-500 mt-1">
            สร้างกิจกรรมของหลักสูตร เพื่อให้นักศึกษาเข้ามาลงทะเบียนและบันทึกรายชื่อในระบบฐานข้อมูล
          </p>
        </div>
        <Link href="/admin/activities" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
          &larr; ย้อนกลับไปหน้ารายการ
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่องานกิจกรรม / โครงการ *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น อบรมเชิงปฏิบัติการ Docker สำหรับนักศึกษาปี 3"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">หมวดหมู่ชั่วโมงกิจกรรม *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium outline-none focus:border-blue-500"
            >
              <option value="ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)">ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)</option>
              <option value="ชั่วโมงจิตอาสา">ชั่วโมงจิตอาสา</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">จำนวนชั่วโมงที่นักศึกษาจะได้รับ *</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-blue-700 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่จัดกิจกรรม *</label>
            <input
              type="date"
              required
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">เวลาจัดกิจกรรม (เริ่มต้น - สิ้นสุด) *</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium text-center"
              />
              <span className="text-slate-400 font-bold text-xs">ถึง</span>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium text-center"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">สถานที่จัดกิจกรรม</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">จำนวนที่รับสมัคร (คน)</label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียดกิจกรรม / กำหนดการ</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link href="/admin/activities" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
            ยกเลิก
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">
            บันทึกและเปิดรับสมัคร
          </button>
        </div>
      </form>
    </div>
  );
}