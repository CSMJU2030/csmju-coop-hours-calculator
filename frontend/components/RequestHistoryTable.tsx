'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { HourRequest } from '@/lib/types';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import { formatHours, formatThaiDate } from '@/lib/utils';

const CATEGORY_LABEL: Record<string, string> = {
  COOP: 'สหกิจ',
  VOLUNTEER: 'จิตอาสา',
  MAJOR: 'สาขา',
};

export function RequestHistoryTable({ requests: initialRequests }: { requests: HourRequest[] }) {
  const displayRequests = initialRequests || [];
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary text-primary-dark">
          <tr>
            <th className="px-4 py-3 font-medium">กิจกรรม</th>
            <th className="px-4 py-3 font-medium">หมวดหมู่</th>
            <th className="px-4 py-3 font-medium">ชั่วโมง</th>
            <th className="px-4 py-3 font-medium">หลักฐาน</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">วันที่ยื่น</th>
            <th className="px-4 py-3 font-medium">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayRequests.map((r) => {
            const isRejected = r.status === 'REJECTED';

            return (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral">{r.title}</p>
                  {r.description && <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[r.category] ?? r.category}</td>
                <td className="px-4 py-3 text-slate-600 font-semibold">{typeof r.hours === 'number' ? r.hours : formatHours(r.hours)} ชม.</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.proofUrl ? (
                    <button
                      type="button"
                      onClick={() => setSelectedProof(r.proofUrl)}
                      className="text-primary hover:underline text-xs font-semibold cursor-pointer"
                    >
                      ดูหลักฐาน
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RequestStatusBadge status={r.status} />
                  {isRejected && r.rejectionReason && (
                    <p className="mt-1 max-w-xs text-xs text-rose-600 font-medium">
                      เหตุผล: {r.rejectionReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {typeof r.createdAt === 'string' ? r.createdAt : formatThaiDate(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {/* เปลี่ยนให้กดยื่นขอใหม่ โดยพาไปหน้า /requests/new ทันที */}
                  {isRejected ? (
                    <Link
                      href="/requests/new"
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition inline-block shadow-xs"
                    >
                      + ยื่นขอใหม่
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
          {displayRequests.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                คุณยังไม่มีคำร้องขอชั่วโมงกิจกรรม
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal เปิดดูรูปภาพหลักฐาน */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">รูปภาพหลักฐาน</h3>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-80 overflow-auto flex justify-center bg-slate-50 rounded-xl p-2 border border-slate-200">
              <img src={selectedProof} alt="หลักฐาน" className="max-h-72 object-contain" />
            </div>
            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}