'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  COOP_CONFIG,
  THAI_MONTHS,
  THAI_DAYS_SHORT,
  getCurrentThailandDate,
  formatThaiDate,
  getCountdownToDeadline,
} from '@/lib/coopConfig';

export interface ActivityItem {
  id: string;
  dateStr: string;
  timeStr: string;
  title: string;
  categoryTarget: 'COOP' | 'VOLUNTEER';
  typeDetail: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | string;
  statusText: string;
  hours: number;
  approvedHours?: number | null;
  approvedCategory?: 'COOP' | 'VOLUNTEER';
  typeCategory?: string;
  reason?: string;
  imageProof?: string;
  note?: string;
}

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

export default function StudentDashboardPage() {
  const today = useMemo(() => getCurrentThailandDate(), []);

  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [publishedList, setPublishedList] = useState<PublishedActivity[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<ActivityItem | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState<'COOP' | 'VOLUNTEER'>('COOP');
  const [newTypeDetail, setNewTypeDetail] = useState('กิจกรรมภายนอก (คอมพิวเตอร์)');
  const [newHours, setNewHours] = useState('3');
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  // โหลดข้อมูลทั้งหมดจาก API (ฐานข้อมูล PostgreSQL ผ่าน Prisma) โดยตรง
  const loadAllData = async () => {
    try {
      const response = await fetch('/api/student/dashboard', { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const dbData = await response.json();
        if (dbData?.activities) setActivities(dbData.activities);
        if (dbData?.publishedList) setPublishedList(dbData.publishedList);
        if (dbData?.registeredIds) setRegisteredIds(dbData.registeredIds);
      }
    } catch (err) {
      console.error('Error fetching data from database:', err);
    }
  };

  useEffect(() => {
    loadAllData();

    // ดักฟังการอัปเดตข้ามแท็บ (เมื่อหน้า Admin มีการปิดรับ/เปิดรับ หรือลบกิจกรรม)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'csmju_activity_sync') {
        loadAllData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('csmju_activity_updated', loadAllData);
    window.addEventListener('csmju_hours_updated', loadAllData);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('csmju_activity_updated', loadAllData);
      window.removeEventListener('csmju_hours_updated', loadAllData);
    };
  }, []);

  const handleRegisterActivity = async (act: PublishedActivity) => {
    const isRegistered = registeredIds.includes(act.id);
    const action = isRegistered ? 'CANCEL' : 'REGISTER';

    const currentCount = act.registeredCount || 0;
    if (!isRegistered && currentCount >= act.capacity) {
      alert('ขออภัย กิจกรรมนี้ที่นั่งเต็มแล้ว');
      return;
    }

    try {
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: act.id, action }),
      });
      if (res.ok) {
        await loadAllData();
        // แจ้งเตือนหน้า Admin ให้รีเฟรชยอดผู้สมัครด้วย
        window.dispatchEvent(new Event('csmju_activity_updated'));
        localStorage.setItem('csmju_activity_sync', Date.now().toString());

        if (isRegistered) {
          alert(`ยกเลิกการลงทะเบียน "${act.title}" เรียบร้อยแล้ว`);
        } else {
          alert(`ลงทะเบียนสำเร็จ: "${act.title}" ได้รับ ${act.hours} ชั่วโมงเรียบร้อยแล้ว!`);
        }
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล');
      }
    } catch (e) {
      console.error(e);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const coopTarget = 15;

  const coopHoursEarned = useMemo(() => {
    return activities
      .filter(
        (a) =>
          (a.status === 'APPROVED' || a.status === 'อนุมัติแล้ว') &&
          (
            a.approvedCategory === 'COOP' || 
            a.typeCategory === 'COOP' ||
            (!a.approvedCategory && (a.categoryTarget === 'COOP' || !a.typeCategory))
          )
      )
      .reduce((sum, a) => sum + (Number(a.approvedHours ?? a.hours) || 0), 0);
  }, [activities]);

  const volunteerHoursEarned = useMemo(() => {
    return activities
      .filter(
        (a) =>
          (a.status === 'APPROVED' || a.status === 'อนุมัติแล้ว') &&
          (
            a.approvedCategory === 'VOLUNTEER' || 
            a.typeCategory === 'VOLUNTEER' ||
            (!a.approvedCategory && a.categoryTarget === 'VOLUNTEER')
          )
      )
      .reduce((sum, a) => sum + (Number(a.approvedHours ?? a.hours) || 0), 0);
  }, [activities]);

  const countdownInternship = useMemo(() => {
    return getCountdownToDeadline(COOP_CONFIG.internshipStartDate, today);
  }, [today]);

  const countdownSearch = useMemo(() => {
    return getCountdownToDeadline(COOP_CONFIG.internshipSearchDeadline, today);
  }, [today]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setNewImagePreview(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAct: ActivityItem = {
      id: `req-${Date.now()}`,
      dateStr: formatThaiDate(today),
      timeStr: '09:00 - 16:00',
      title: newTitle,
      categoryTarget: newTarget,
      typeDetail: newTypeDetail,
      status: 'PENDING_APPROVAL',
      statusText: 'รอตรวจสอบ',
      hours: Number(newHours) || 1,
      approvedHours: Number(newHours) || 1,
      imageProof: newImagePreview || undefined,
      note: newNote,
    };

    try {
      const res = await fetch('/api/student/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAct),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (err) {
      console.error('API connection failed');
    }

    setIsSubmitModalOpen(false);
    setNewTitle('');
    setNewImagePreview(null);
    setNewNote('');
    alert('ส่งคำร้องให้อาจารย์ตรวจสอบผ่านระบบเรียบร้อยแล้ว');
  };

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysCount; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* 1. ส่วนหัวแบนเนอร์ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-700 to-blue-600 border border-blue-400/20 p-8 md:p-10 shadow-2xl shadow-blue-900/20 transition-all duration-300 hover:shadow-2xl hover:border-slate-700">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 backdrop-blur-sm text-xs font-semibold">
              นักศึกษา รหัส 67 • 
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              นางสาวพัฒน์นรี วันพิลา
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-3 bg-white hover:bg-blue-50 active:scale-95 text-blue-700 rounded-2xl text-xs font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>+ ยื่นขอชั่วโมงกิจกรรม</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. สรุปชั่วโมง */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* การ์ด 1: สหกิจศึกษา */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 border border-blue-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-blue-300 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/40 active:scale-98 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider group-hover:text-blue-700 transition-colors">
              ชั่วโมงวิชาชีพ / สหกิจ (สาขา)
            </span>
            {coopHoursEarned >= coopTarget ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                ครบเกณฑ์แล้ว
              </span>
            ) : (
              <span className="text-xs text-blue-400 group-hover:scale-125 transition-transform duration-300">
                
              </span>
            )}
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-black text-slate-800 group-hover:text-blue-900 transition-colors">
              {coopHoursEarned}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-1.5">/ {coopTarget} ชม. ขั้นต่ำ</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${
                coopHoursEarned >= coopTarget ? 'bg-emerald-500' : 'bg-blue-600 group-hover:bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (coopHoursEarned / coopTarget) * 100)}%` }}
            />
          </div>
        </div>

        {/* การ์ด 2: จิตอาสา */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 border border-blue-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:via-white hover:to-teal-50 active:scale-98 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
              ชั่วโมงจิตอาสา
            </span>
            <span className="text-xs text-emerald-400 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
              
            </span>
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-black text-slate-800 group-hover:text-emerald-800 transition-colors">
              {volunteerHoursEarned}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-1.5">ชม. สะสม</span>
          </div>
          <div className="text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
            สะสมได้อิสระ ไม่จำกัดจำนวนชั่วโมง
          </div>
        </div>

        {/* การ์ด 3: กำหนดการฝึกงาน รหัส 67 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 border border-blue-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-amber-400 hover:bg-gradient-to-br hover:from-amber-50 hover:via-white hover:to-orange-50 active:scale-98 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              กำหนดการฝึกงาน รหัส 67
            </span>
            <span className="text-xs text-amber-400 group-hover:scale-125 transition-transform duration-300">
              
            </span>
          </div>
          <div className="my-1 text-xs text-slate-700 space-y-1">
            <p className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">ฝึกงาน:</span>
              <span className="font-bold text-slate-800 group-hover:text-amber-900 transition-colors">3 พ.ค. – 30 มิ.ย. 70</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">สหกิจศึกษา:</span>
              <span className="font-bold text-slate-800 group-hover:text-amber-900 transition-colors">5 ก.ค. – 29 ต.ค. 70</span>
            </p>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-1.5 mt-0.5 group-hover:text-amber-700 transition-colors">
            หาที่ฝึกงานถึง: <b>29 ม.ค. 2570</b>
          </div>
        </div>

        {/* การ์ด 4: นับถอยหลังสู่วันฝึกงาน */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 border border-blue-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:via-white hover:to-violet-50 active:scale-98 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider group-hover:text-indigo-700 transition-colors">
              นับถอยหลังสู่วันฝึกงาน
            </span>
            <span className="text-xs text-indigo-400 group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-300">
              
            </span>
          </div>
          <div className="my-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-indigo-600 group-hover:text-indigo-700 group-hover:scale-105 transition-all">
              {countdownInternship.days}
            </span>
            <span className="text-xs font-bold text-slate-400">วัน</span>
          </div>
          <div className="text-[11px] text-slate-400 group-hover:text-indigo-600 transition-colors">
            (หาที่ฝึกงาน: {countdownSearch.text})
          </div>
        </div>
      </div>

      {/* 3. กิจกรรมของหลักสูตรที่เปิดรับสมัคร */}
      <div className="rounded-3xl bg-white p-6 border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span></span> กิจกรรมของหลักสูตรที่เปิดรับสมัคร
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กิจกรรมที่อาจารย์ประกาศเปิดรับผ่านฐานข้อมูลหลักสูตร
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            เปิดรับสมัคร {publishedList.filter((a) => a.status === 'OPEN').length} กิจกรรม
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedList.map((act) => {
            const isRegistered = registeredIds.includes(act.id);
            const currentRegistered = act.registeredCount || 0;
            const isFull = currentRegistered >= act.capacity;
            const isClosed = act.status === 'CLOSED';

            return (
              <div
                key={act.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isRegistered
                    ? 'bg-blue-50/40 border-blue-200'
                    : isClosed
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : isFull
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        act.category.includes('จิตอาสา')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {act.category}
                    </span>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      +{act.hours} ชม.
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{act.title}</h3>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p><b>วันที่:</b> {act.dateStr}</p>
                    <p><b>สถานที่:</b> {act.location}</p>
                    <p>
                      <b>จำนวนผู้สมัคร:</b>{' '}
                      <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-slate-700'}`}>
                        {currentRegistered} / {act.capacity} คน
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isRegistered ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        ✓ ลงทะเบียนแล้ว
                      </span>
                    ) : isClosed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        ปิดรับสมัครแล้ว
                      </span>
                    ) : isFull ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        ที่นั่งเต็มแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        เปิดรับสมัครอยู่
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={(!isRegistered && isClosed) || (!isRegistered && isFull)}
                    onClick={() => handleRegisterActivity(act)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                      isRegistered
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                        : isClosed
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isFull
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/20'
                    }`}
                  >
                    {isRegistered
                      ? 'ยกเลิกการลงทะเบียน'
                      : isClosed
                      ? 'ปิดรับสมัครแล้ว'
                      : isFull
                      ? 'เต็มแล้ว'
                      : 'กดลงทะเบียนเข้าร่วม'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ตารางปฏิทินและประวัติรายการที่ยื่น */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ปฏิทิน */}
        <div className="lg:col-span-5 rounded-3xl bg-white p-6 border border-blue-100 shadow-sm space-y-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase">ปฏิทินการฝึกงาน</h2>
            <span className="text-xs text-slate-500">{THAI_MONTHS[viewMonth]} {viewYear + 543}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {THAI_DAYS_SHORT.map((day) => (
              <span key={day} className="font-bold text-slate-400 py-1">{day}</span>
            ))}
            {calendarCells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} className="py-2" />;
              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear();
              return (
                <div
                  key={`day-${day}`}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isToday
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-slate-700 hover:bg-slate-100 hover:scale-105'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* ประวัติกิจกรรมของฉัน */}
        <div className="lg:col-span-7 rounded-3xl bg-white p-6 border border-blue-100 shadow-sm space-y-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase">ประวัติกิจกรรมของฉัน ({activities.length})</h2>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
            >
              + ยื่นกิจกรรม
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {activities.map((act) => {
              const isApproved = act.status === 'APPROVED' || act.status === 'อนุมัติแล้ว';
              const isRejected = act.status === 'REJECTED' || act.status === 'ไม่อนุมัติ';
              const currentCategory = act.approvedCategory || act.categoryTarget;
              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivityDetail(act)}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-400 hover:bg-white hover:shadow-md hover:-translate-y-1 active:scale-98 cursor-pointer transition-all duration-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        currentCategory === 'VOLUNTEER'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {currentCategory === 'VOLUNTEER' ? 'จิตอาสา' : 'สหกิจศึกษา'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-700'
                          : isRejected
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {act.statusText}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{act.title}</p>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{act.typeDetail}</span>
                    <span className="font-bold text-blue-700">{act.approvedHours ?? act.hours} ชม.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal ยื่นคำร้องขอชั่วโมง */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl scale-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-bold text-slate-800">ยื่นคำร้องขอชั่วโมงกิจกรรม</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700">ชื่องานกิจกรรม / โครงการ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เข้าร่วมสัมมนาวิชาการ, กิจกรรมค่ายอาสา"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700">ต้องการนับเป็นชั่วโมง *</label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value as 'COOP' | 'VOLUNTEER')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="COOP">ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)</option>
                    <option value="VOLUNTEER">ชั่วโมงจิตอาสา</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-700">จำนวนชั่วโมงที่ขอ *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="ระบุจำนวนชั่วโมง"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700">หมวดหมู่กิจกรรม</label>
                <select
                  value={newTypeDetail}
                  onChange={(e) => setNewTypeDetail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="กิจกรรมภายนอก (คอมพิวเตอร์)">กิจกรรมภายนอก (คอมพิวเตอร์)</option>
                  <option value="กิจกรรมสาขา / คณะ">กิจกรรมสาขา / คณะ</option>
                  <option value="อบรม / สัมมนาวิชาการ">อบรม / สัมมนาวิชาการ</option>
                  <option value="กิจกรรมจิตอาสา">กิจกรรมจิตอาสา</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700">แนบรูปถ่ายหลักฐาน / เกียรติบัตร</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 rounded-xl border border-slate-200 text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {newImagePreview && (
                  <div className="mt-2 text-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <img src={newImagePreview} alt="Preview" className="max-h-36 mx-auto object-contain rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700">รายละเอียด / หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="ระบุสิ่งที่ได้จากการเข้าร่วมกิจกรรม..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition cursor-pointer"
                >
                  ส่งให้อาจารย์ตรวจสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ดูรายละเอียดคำร้อง */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3 shadow-2xl scale-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">รายละเอียดคำร้อง</h3>
              <button onClick={() => setSelectedActivityDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
                &times;
              </button>
            </div>
            <div className="text-xs space-y-2">
              <p><b>กิจกรรม:</b> {selectedActivityDetail.title}</p>
              <p>
                <b>หมวดชั่วโมง:</b>{' '}
                {(selectedActivityDetail.approvedCategory || selectedActivityDetail.categoryTarget) === 'VOLUNTEER'
                  ? 'จิตอาสา'
                  : 'สหกิจศึกษา'}
              </p>
              <p><b>จำนวน:</b> {selectedActivityDetail.approvedHours ?? selectedActivityDetail.hours} ชั่วโมง</p>
              <p><b>สถานะ:</b> {selectedActivityDetail.statusText}</p>
              {selectedActivityDetail.reason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                  <b>เหตุผล:</b> {selectedActivityDetail.reason}
                </div>
              )}
              {selectedActivityDetail.imageProof && (
                <img
                  src={selectedActivityDetail.imageProof}
                  alt="Proof"
                  className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                />
              )}
            </div>
            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}