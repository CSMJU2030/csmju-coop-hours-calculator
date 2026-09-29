'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  title: string;
  categoryTarget?: 'COOP' | 'VOLUNTEER' | string;
  typeDetail?: string;
  type?: string;
  hours: number;
  approvedHours?: number | null;
  dateStr: string;
  timeStr?: string;
  status: string;
  statusText?: string;
  approvedCategory?: 'COOP' | 'VOLUNTEER' | string;
  imageProof?: string | null;
  note?: string | null;
  reason?: string;
  UserProfile?: {
    fullName: string;
    studentCode: string;
  };
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ActivityItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // State สำหรับการพิจารณาของอาจารย์
  const [editHours, setEditHours] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<'COOP' | 'VOLUNTEER'>('COOP');
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    loadData();
    window.addEventListener('csmju_activity_updated', loadData);
    return () => window.removeEventListener('csmju_activity_updated', loadData);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/requests', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.requests && Array.isArray(data.requests)) {
          setRequests(data.requests);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch failed, fallback to local storage:', err);
    }

    // Fallback โหมด LocalStorage สำหรับสำรองข้อมูล
    const saved = localStorage.getItem('csmju_shared_activities');
    if (saved) {
      try {
        setRequests(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // ข้อมูลเริ่มต้นสำหรับทดสอบระบบ
      const defaultData: ActivityItem[] = [
        {
          id: 'req-1',
          title: 'อบรมการพัฒนาเว็บไซต์ด้วย React',
          categoryTarget: 'COOP',
          hours: 6,
          dateStr: '10 ก.ย. 2568',
          status: 'APPROVED',
          statusText: 'อนุมัติแล้ว',
          approvedCategory: 'COOP',
          approvedHours: 6,
          UserProfile: { fullName: 'นายสมชาย ใจดี', studentCode: '6704101359' }
        },
        {
          id: 'req-2',
          title: 'ปลุกป่าชายเลน',
          categoryTarget: 'VOLUNTEER',
          hours: 3,
          dateStr: '18 ก.ย. 2569',
          status: 'PENDING_APPROVAL',
          statusText: 'รอตรวจสอบ',
          UserProfile: { fullName: 'นายสมชาย ใจดี', studentCode: '6704101359' }
        }
      ];
      setRequests(defaultData);
      localStorage.setItem('csmju_shared_activities', JSON.stringify(defaultData));
    }
  };

  const openReviewModal = (item: ActivityItem) => {
    setSelectedItem(item);
    setEditHours(item.approvedHours ?? item.hours);
    const initialCategory = (item.approvedCategory || item.categoryTarget || 'COOP') as 'COOP' | 'VOLUNTEER';
    setEditCategory(initialCategory === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP');
    setRejectReason(item.reason || '');
  };

  // อาจารย์บันทึกผลการตรวจ (ระบุหมวดหมู่ที่อนุมัติ + จำนวนชั่วโมง)
  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedItem) return;

    if (status === 'REJECTED' && !rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อแจ้งให้นักศึกษาทราบ');
      return;
    }

    try {
      await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedItem.id,
          status,
          approvedHours: Number(editHours),
          approvedCategory: editCategory,
          rejectReason: status === 'REJECTED' ? rejectReason : '',
        }),
      });
    } catch (e) {
      console.error('API update failed:', e);
    }

    const updated = requests.map((req) => {
      if (req.id === selectedItem.id) {
        return {
          ...req,
          approvedHours: Number(editHours),
          status: status,
          statusText: status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ',
          approvedCategory: status === 'APPROVED' ? editCategory : undefined,
          reason: status === 'REJECTED' ? rejectReason : '',
        };
      }
      return req;
    });

    localStorage.setItem('csmju_shared_activities', JSON.stringify(updated));
    setRequests(updated);
    setSelectedItem(null);
    window.dispatchEvent(new Event('csmju_hours_updated'));

    alert(
      status === 'APPROVED'
        ? `อนุมัติคำร้องเรียบร้อย (${editCategory === 'COOP' ? 'ชั่วโมงสหกิจศึกษา' : 'ชั่วโมงจิตอาสา'} ${editHours} ชม.)`
        : 'ปฏิเสธคำร้องเรียบร้อยแล้ว'
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ส่วนหัวหน้าของอาจารย์ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตรวจสอบและอนุมัติคำร้องขอชั่วโมง</h1>
          <p className="text-xs text-slate-500 mt-1">
            พิจารณาและกำหนดหมวดหมู่ชั่วโมง (สหกิจศึกษา / จิตอาสา) ให้แก่นักศึกษาจากระบบฐานข้อมูล
          </p>
        </div>
      </div>

      {/* ตารางแสดงผลรายการคำร้อง */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-bold">นักศึกษา / กิจกรรม</th>
                <th className="p-4 font-bold text-center">หมวดที่ขอ / อนุมัติให้</th>
                <th className="p-4 font-bold text-center">ชั่วโมง</th>
                <th className="p-4 font-bold text-center">หลักฐาน</th>
                <th className="p-4 font-bold text-center">สถานะ</th>
                <th className="p-4 font-bold">วันที่ยื่น</th>
                <th className="p-4 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((item) => {
                const targetCat =
                  item.approvedCategory ||
                  item.categoryTarget ||
                  (item.type?.includes('จิตอาสา') ? 'VOLUNTEER' : 'COOP');
                const isApproved = item.status === 'APPROVED' || item.status === 'อนุมัติแล้ว';
                const isRejected = item.status === 'REJECTED' || item.status === 'ไม่อนุมัติ';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-medium text-slate-800">
                      {item.UserProfile && (
                        <p className="text-[11px] font-bold text-blue-900 mb-0.5">
                          {item.UserProfile.fullName} ({item.UserProfile.studentCode})
                        </p>
                      )}
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.typeDetail || item.type || 'กิจกรรมภายนอก'}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          targetCat === 'VOLUNTEER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {targetCat === 'VOLUNTEER' ? 'จิตอาสา' : 'สหกิจศึกษา'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-extrabold text-blue-600 whitespace-nowrap">
                      {item.approvedHours ?? item.hours} ชม.
                    </td>
                    <td className="p-4 text-center">
                      {item.imageProof ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(item.imageProof || null)}
                          className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          ดูรูปภาพ
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.statusText || (isApproved ? 'อนุมัติแล้ว' : isRejected ? 'ไม่อนุมัติ' : 'รอตรวจสอบ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap text-xs">
                      {item.dateStr}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReviewModal(item)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer shadow-xs"
                        >
                          ตรวจสอบ
                        </button>
                       
                      </div>
                    </td>
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    ไม่มีรายการคำร้องที่ยื่นเข้ามาในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: พิจารณา/เลือกหมวดหมู่อนุมัติ/แก้ไขชั่วโมง */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">📝 พิจารณาคำร้องขอชั่วโมง</h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                <p className="text-sm font-bold text-slate-800">{selectedItem.title}</p>
                <p className="text-slate-600">
                  ประเภท: <b>{selectedItem.typeDetail || selectedItem.type || 'กิจกรรมภายนอก'}</b>
                </p>
                <p className="text-slate-600">
                  วันที่ยื่น: <b>{selectedItem.dateStr}</b>
                </p>
                {selectedItem.note && (
                  <p className="text-slate-500 mt-1">รายละเอียด: {selectedItem.note}</p>
                )}
              </div>

              {/* ให้อาจารย์เลือกหมวดหมู่ที่ต้องการอนุมัติให้ */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  อาจารย์อนุมัติเข้าเป็นชั่วโมงในหมวด:
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as 'COOP' | 'VOLUNTEER')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="COOP">ชั่วโมงวิชาชีพ / สหกิจศึกษา (COOP)</option>
                  <option value="VOLUNTEER">ชั่วโมงจิตอาสา (VOLUNTEER)</option>
                </select>
              </div>

              {/* ช่องให้อาจารย์ปรับแก้ไขจำนวนชั่วโมง */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จำนวนชั่วโมงที่อนุมัติให้:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={editHours}
                    onChange={(e) => setEditHours(Number(e.target.value))}
                    className="w-32 px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-blue-700 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-600 font-medium">ชั่วโมง</span>
                </div>
              </div>

              {/* รูปหลักฐาน */}
              {selectedItem.imageProof && (
                <div>
                  <p className="font-bold text-slate-700 mb-1">หลักฐานที่แนบมา:</p>
                  <div
                    onClick={() => setPreviewImage(selectedItem.imageProof || null)}
                    className="cursor-pointer group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-44 flex items-center justify-center"
                  >
                    <img
                      src={selectedItem.imageProof}
                      alt="หลักฐาน"
                      className="max-h-44 object-contain transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                      🔍 คลิกเพื่อดูรูปขนาดใหญ่
                    </div>
                  </div>
                </div>
              )}

              {/* ช่องใส่เหตุผลกรณีไม่อนุมัติ */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เหตุผลกรณีไม่อนุมัติ / ข้อเสนอแนะแก่นักศึกษา:
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น เอกสารหลักฐานไม่ชัดเจน หรือไม่ตรงตามเงื่อนไข..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {/* ปุ่มกดพิจารณา */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleAction('REJECTED')}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer"
              >
                ✕ ไม่อนุมัติ
              </button>
              <button
                type="button"
                onClick={() => handleAction('APPROVED')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                ✓ อนุมัติ ({editHours} ชม. เข้า{editCategory === 'COOP' ? 'สหกิจ' : 'จิตอาสา'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ดูรูปภาพขนาดใหญ่ */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold text-sm cursor-pointer"
            >
              ✕ ปิดหน้าต่าง
            </button>
            <div className="bg-white p-2 rounded-2xl max-h-[85vh] overflow-auto shadow-2xl">
              <img
                src={previewImage}
                alt="รูปภาพหลักฐานขนาดใหญ่"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}