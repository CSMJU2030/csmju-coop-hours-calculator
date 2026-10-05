/**
 * ข้อความแสดงผลของกิจกรรม — คำนวณจากข้อมูลที่ backend ส่งมา ไม่เดาค่าเอง
 */

interface ActivityHours {
  coopHours?: number;
  volunteerHours?: number;
  majorHours?: number;
}

/** ป้ายหมวดชั่วโมงของกิจกรรม (ค่า activityType ในฐานข้อมูลเป็น GENERAL เสมอ ใช้แสดงไม่ได้) */
export function activityCategoryLabel(a: ActivityHours): string {
  const coop = (a.coopHours ?? 0) > 0;
  const volunteer = (a.volunteerHours ?? 0) > 0;
  const major = (a.majorHours ?? 0) > 0;

  if (volunteer && !coop && !major) return 'ชั่วโมงจิตอาสา';
  if (coop && !volunteer && !major) return 'ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)';
  if (major && !coop && !volunteer) return 'ชั่วโมงสาขา';
  return 'ชั่วโมงสหกิจศึกษาและจิตอาสา';
}

const timeFormat = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Bangkok',
});

/** ช่วงเวลาของกิจกรรมเป็น "09:00 - 16:00 น." (เวลาไทย) จากค่า ISO ที่ backend ส่งมา */
export function formatActivityTime(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  return `${timeFormat.format(s)} - ${timeFormat.format(e)} น.`;
}
