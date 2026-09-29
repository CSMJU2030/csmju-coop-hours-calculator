// lib/coopConfig.ts

export const COOP_CONFIG = {
  requiredHours: 15, // เกณฑ์ชั่วโมงเตรียมสหกิจของสาขา 15 ชั่วโมง
  internshipSearchDeadline: '2027-01-29T23:59:59+07:00', // หาที่ฝึกงานถึง 29 ม.ค. 2570
  internshipStartDate: '2027-05-03T00:00:00+07:00',      // เริ่มฝึกงาน 3 พ.ค. 2570[cite: 10]
  internshipEndDate: '2027-06-30T23:59:59+07:00',        // สิ้นสุดฝึกงาน 30 มิ.ย. 2570[cite: 10]
  cooperativeStartDate: '2027-07-05T00:00:00+07:00',     // กรณีต่อสหกิจ 5 ก.ค. 2570[cite: 10]
  cooperativeEndDate: '2027-10-29T23:59:59+07:00',       // สิ้นสุดสหกิจ 29 ต.ค. 2570[cite: 10]
};

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function getCurrentThailandDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7); // GMT+7 Asia/Bangkok
}

export function formatThaiDate(date: Date): string {
  const d = date.getDate();
  const m = THAI_MONTHS[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${d} ${m} ${y}`;
}

export function getCountdownToDeadline(deadlineIso: string, currentDate: Date): { text: string; days: number } {
  const target = new Date(deadlineIso);
  const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetMidnight.getTime() - current.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return {
    text: diffDays > 0 ? `เหลืออีก ${diffDays} วัน` : diffDays === 0 ? 'วันนี้วันสุดท้าย' : `เลยกำหนด ${Math.abs(diffDays)} วัน`,
    days: Math.max(0, diffDays),
  };
}

export function getInternshipStatus(startDateIso: string, endDateIso: string, currentDate: Date): string {
  const start = new Date(startDateIso);
  const end = new Date(endDateIso);
  if (currentDate < start) return 'ยังไม่เริ่มฝึกงาน';
  if (currentDate >= start && currentDate <= end) return 'กำลังฝึกงาน';
  return 'สิ้นสุดการฝึกงาน';
}