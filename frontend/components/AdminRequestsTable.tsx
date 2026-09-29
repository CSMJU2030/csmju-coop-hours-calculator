'use client';

import { useState } from 'react';
import type { HourRequest } from '@/lib/types';
import { formatHours, formatThaiDate } from '@/lib/utils';

const CATEGORY_LABEL: Record<string, string> = {
  COOP: 'สหกิจ',
  VOLUNTEER: 'จิตอาสา',
  MAJOR: 'สาขา',
};

export function AdminRequestsTable({ requests }: { requests: HourRequest[] }) {
  // เก็บ ID ของรายการที่อาจารย์ติ๊ก Checkbox
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // คำนวณชั่วโมงรวมเฉพาะรายการที่ติ๊กเลือก
  const totalApprovedHours = requests
    .filter((r) => selectedIds.has(r.id))
    .reduce((sum, r) => sum + r.hours, 0);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  }

  return (
    <div className="space-y-4">
      {/* แถบสรุปชั่วโมงที่อาจารย์ติ๊กเลือก */}
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-white p-4">
        <div className="flex items-center gap-3">
          <button onClick={toggleSelectAll} className="btn-secondary text-xs">
            {selectedIds.size === requests.length && requests.length > 0 ? 'ยกเลิกการเลือก' : 'เลือกทั้งหมด'}
          </button>
          <span className="text-sm text-slate-600">
            ติ๊กเลือกผ่านแล้ว <b>{selectedIds.size}</b> จาก {requests.length} รายการ
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <span className="text-slate-500">ชั่วโมงที่คำนวณได้: </span>
            <span className="text-lg font-bold text-primary">{formatHours(totalApprovedHours)}</span>
            <span className="text-xs text-slate-500"> ชม.</span>
          </div>
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={() => alert(`จำลองการส่ง: บันทึกชั่วโมงสำเร็จ รวม ${totalApprovedHours} ชั่วโมง`)}
            className="btn-primary"
          >
            บันทึกการอนุมัติ ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* ตารางแสดงข้อมูลนักศึกษาและรูปภาพ */}
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary text-primary-dark">
            <tr>
              <th className="w-12 px-4 py-3 text-center">ผ่าน</th>
              <th className="px-4 py-3 font-medium">รูปหน้า - ข้อมูล นศ.</th>
              <th className="px-4 py-3 font-medium">กิจกรรมที่ยื่น</th>
              <th className="px-4 py-3 font-medium">หมวดหมู่</th>
              <th className="px-4 py-3 font-medium">ชั่วโมงที่ขอ</th>
              <th className="px-4 py-3 font-medium">หลักฐานงาน</th>
              <th className="px-4 py-3 font-medium">วันที่ยื่น</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => {
              const isChecked = selectedIds.has(r.id);
              // Mock URL รูปนักศึกษาตามรหัสนักศึกษา (หรือใช้ r.studentPhotoUrl หากมี)
              const mockPhotoUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${r.studentCode ?? r.id}`;

              return (
                <tr key={r.id} className={isChecked ? 'bg-primary/5' : 'hover:bg-slate-50'}>
                  {/* Checkbox ติ๊กถูก/ผิด */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(r.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>

                  {/* รูปหน้านักศึกษา + ชื่อ/รหัส */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mockPhotoUrl}
                        alt={r.studentName}
                        onClick={() => setPreviewImage(mockPhotoUrl)}
                        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover cursor-pointer hover:ring-2 hover:ring-primary"
                        title="คลิกเพื่อดูรูปขยาย"
                      />
                      <div>
                        <p className="font-semibold text-neutral">{r.studentCode ?? ""}</p>
                        <p className="text-xs text-slate-400">{r.studentName}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-neutral font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[r.category] ?? r.category}</td>
                  <td className="px-4 py-3 font-semibold text-primary-dark">{formatHours(r.hours)} ชม.</td>
                  <td className="px-4 py-3">
                    {r.proofUrl ? (
                      <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        ดูเอกสาร
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatThaiDate(new Date(r.createdAt))}</td>
                </tr>
              );
            })}

            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  ไม่มีคำร้องที่รอตรวจสอบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ดูรูปนักศึกษาแบบขยาย */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-xs rounded-card bg-white p-4 shadow-xl text-center">
            <h4 className="mb-2 font-semibold text-primary-dark">รูปถ่ายนักศึกษา</h4>
            <img src={previewImage} alt="ขยายรูป" className="h-48 w-48 mx-auto rounded-lg object-contain bg-slate-50" />
            <button onClick={() => setPreviewImage(null)} className="btn-secondary mt-4 w-full text-xs">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}