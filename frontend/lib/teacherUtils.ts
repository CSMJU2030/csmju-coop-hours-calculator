// lib/teacherUtils.ts

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function getCurrentThailandDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7)); // GMT+7 Asia/Bangkok
}

export function formatThaiDate(date: Date): string {
  const d = date.getDate();
  const m = THAI_MONTHS[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${d} ${m} ${y}`;
}

export function formatThaiMonthYear(year: number, month: number): string {
  return `${THAI_MONTHS[month]} ${year + 543}`;
}