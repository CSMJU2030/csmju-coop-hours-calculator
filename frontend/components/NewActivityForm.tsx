'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createActivity } from '@/lib/actions/activity';

export function NewActivityForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createActivity(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push('/admin/activities');
    });
  }

  return (
    <form action={handleSubmit} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="title">
          ชื่อกิจกรรม
        </label>
        <input id="title" name="title" required className="input" placeholder="เช่น ค่ายอาสาพัฒนาชุมชน" />
      </div>

      <div>
        <label className="label" htmlFor="description">
          รายละเอียด
        </label>
        <textarea id="description" name="description" required rows={3} className="input" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="location">
            สถานที่
          </label>
          <input id="location" name="location" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="lecturerInCharge">
            อาจารย์ผู้รับผิดชอบ
          </label>
          <input id="lecturerInCharge" name="lecturerInCharge" required className="input" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="registrationDeadline">
            ปิดรับสมัคร
          </label>
          <input
            id="registrationDeadline"
            name="registrationDeadline"
            type="datetime-local"
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="startTime">
            เวลาเริ่มกิจกรรม
          </label>
          <input id="startTime" name="startTime" type="datetime-local" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="endTime">
            เวลาสิ้นสุดกิจกรรม
          </label>
          <input id="endTime" name="endTime" type="datetime-local" required className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="capacity">
          จำนวนที่นั่ง (ไม่รวมคิวสำรอง)
        </label>
        <input id="capacity" name="capacity" type="number" min={1} required className="input max-w-[160px]" />
        <p className="mt-1 text-xs text-slate-400">ระบบจะเปิดคิวสำรองอัตโนมัติสูงสุด 5 คนเมื่อที่นั่งเต็ม</p>
      </div>

      <fieldset className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-medium text-neutral">ชั่วโมงที่ได้รับ</legend>
        <div>
          <label className="label" htmlFor="coopHours">
            ชั่วโมงสหกิจ
          </label>
          <input id="coopHours" name="coopHours" type="number" min={0} step={0.5} defaultValue={0} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="volunteerHours">
            ชั่วโมงจิตอาสา
          </label>
          <input
            id="volunteerHours"
            name="volunteerHours"
            type="number"
            min={0}
            step={0.5}
            defaultValue={0}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="majorHours">
            ชั่วโมงสาขา (ไม่ใช่สหกิจ)
          </label>
          <input id="majorHours" name="majorHours" type="number" min={0} step={0.5} defaultValue={0} className="input" />
        </div>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'กำลังบันทึก…' : 'บันทึกกิจกรรม'}
        </button>
      </div>
    </form>
  );
}
