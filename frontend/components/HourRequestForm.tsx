'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface HourRequestFormInitial {
  title?: string;
  category?: string;
  hours?: number;
  proofUrl?: string | null;
  studentPhoto?: string | null;
  description?: string | null;
}

interface HourRequestFormProps {
  requestId?: string;
  initial?: HourRequestFormInitial;
}

export function HourRequestForm({ requestId, initial }: HourRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get('title'),
      categoryTarget: formData.get('category'),
      hours: Number(formData.get('hours')),
      proofUrl: formData.get('proofUrl'),
      studentPhoto: formData.get('studentPhoto'),
      description: formData.get('description'),
    };

    try {
      const url = requestId ? `/api/requests?id=${requestId}` : '/api/requests';
      const method = requestId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm border border-slate-200">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
          ชื่องาน / กิจกรรม
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initial?.title || ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          placeholder="เช่น ช่วยงานสัมมนาวิชาการ"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category">
            ประเภทกิจกรรม
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category || 'COOP'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="COOP">กิจกรรมเตรียมความพร้อมสหกิจ</option>
            <option value="VOLUNTEER">กิจกรรมจิตอาสา</option>
            <option value="MAJOR">กิจกรรมภาควิชา</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="hours">
            จำนวนชั่วโมง
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            min="0.5"
            step="0.5"
            required
            defaultValue={initial?.hours ?? 1}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="proofUrl">
          ลิงก์หลักฐานการเข้าร่วม (URL / Google Drive)
        </label>
        <input
          id="proofUrl"
          name="proofUrl"
          type="url"
          defaultValue={initial?.proofUrl || ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          placeholder="https://drive.google.com/..."
        />
      </div>

      {/* ช่องกรอกรูปถ่ายหน้าตรงของนักศึกษา */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="studentPhoto">
          รูปถ่ายหน้าตรงของนักศึกษา (URL รูปภาพ)
        </label>
        <input
          id="studentPhoto"
          name="studentPhoto"
          type="url"
          defaultValue={initial?.studentPhoto || ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          placeholder="https://example.com/my-face.jpg หรือ วางลิงก์รูปหน้าตรง"
        />
        <p className="mt-1 text-xs text-slate-400">
          ใส่ลิงก์รูปหน้าตรงเพื่อให้ระบบนำไปแสดงที่หน้าตรวจของอาจารย์
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
          รายละเอียดสิ่งที่ทำ
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description || ''}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          placeholder="อธิบายหน้าที่หรือภาระงานที่ได้รับมอบหมาย..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : requestId ? 'บันทึกการแก้ไข' : 'ส่งคำร้อง'}
        </button>
      </div>
    </form>
  );
}

export default HourRequestForm;