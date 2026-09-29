'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewHourRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'กิจกรรมภายนอก (คอมพิวเตอร์)',
    hours: 1,
    activityDate: '',     // วันที่จัดกิจกรรม (ปฏิทิน yyyy-mm-dd)
    startTime: '09:00',   // เวลาเริ่มต้น
    endTime: '16:00',     // เวลาสิ้นสุด
    proofImageBase64: '', // รูปภาพหลักฐาน (แปลงเป็น Base64)
    description: '',
  });

  // จัดการเมื่อเลือกรูปภาพจากเครื่อง
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        setFormData((prev) => ({ ...prev, proofImageBase64: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activityDate) {
      alert('กรุณาเลือกวันที่จัดกิจกรรม');
      return;
    }

    setLoading(true);

    // แปลงวันที่เป็นฟอร์แมตภาษาไทยให้อ่านง่าย เช่น "18 ก.ย. 2569"
    const parsedDate = new Date(formData.activityDate);
    const dateFormatted = !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : formData.activityDate;

    const timeRangeStr = `${formData.startTime} - ${formData.endTime} น.`;

    const payload = {
      title: formData.title,
      category: formData.category,
      hours: Number(formData.hours),
      dateStr: dateFormatted,
      timeStr: timeRangeStr,
      proofUrl: formData.proofImageBase64 || null,
      description: formData.description,
    };

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('ยื่นคำร้องขอชั่วโมงกิจกรรมเข้าสู่ฐานข้อมูลสำเร็จ!');
        router.push('/requests');
        router.refresh();
      } else {
        alert('ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ยื่นคำร้องขอนับชั่วโมงกิจกรรม</h1>
          <p className="text-sm text-slate-500">กรอกข้อมูลรายละเอียดกิจกรรมและแนบหลักฐานเพื่อให้อาจารย์ตรวจสอบผ่านฐานข้อมูล</p>
        </div>
        <Link
          href="/requests"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
        >
          ยกเลิก
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่องาน / กิจกรรม *</label>
          <input
            type="text"
            required
            placeholder="เช่น อบรมการพัฒนาซอฟต์แวร์ด้วย Next.js"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">หมวดหมู่กิจกรรม</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="กิจกรรมภายนอก (คอมพิวเตอร์)">กิจกรรมภายนอก (คอมพิวเตอร์)</option>
              <option value="กิจกรรมสาขา / คณะ">กิจกรรมสาขา / คณะ</option>
              <option value="อบรม / สัมมนาวิชาการ">อบรม / สัมมนาวิชาการ</option>
              <option value="กิจกรรมจิตอาสา">กิจกรรมจิตอาสา</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวนชั่วโมงที่ขอ *</label>
            <input
              type="number"
              min="1"
              max="15"
              required
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ส่วนกำหนดวันที่และช่วงเวลา */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่จัดกิจกรรม *</label>
            <input
              type="date"
              required
              value={formData.activityDate}
              onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">เวลาเริ่มต้น</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">เวลาสิ้นสุด</label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ส่วนอัปโหลดรูปภาพหลักฐานจากเครื่อง */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">รูปภาพหลักฐาน (เกียรติบัตร หรือ ภาพถ่ายหน้างาน)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-blue-400 transition bg-slate-50/50">
            <div className="space-y-2 text-center">
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="ตัวอย่างรูปหลักฐาน"
                    className="mx-auto h-48 object-contain rounded-xl border border-slate-200 bg-white"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-500 underline inline-block"
                  >
                    เปลี่ยนรูปภาพ
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">📸</span>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer font-bold text-sm text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>คลิกเพื่อแนบรูปภาพ</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ PNG, JPG, JPEG (ขนาดไม่เกิน 5MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม / หมายเหตุ</label>
          <textarea
            rows={3}
            placeholder="ระบุสิ่งที่ได้เรียนรู้ หรือข้อมูลเพิ่มเติมให้อาจารย์ทราบ..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึกข้อมูล...' : 'ส่งคำร้องขออนุมัติ'}
        </button>
      </form>
    </div>
  );
}