export const COOP_GOAL_HOURS = 15;
export const MAX_WAITLIST_SIZE = 5;

export interface CoopProgress {
  earned: number;
  goal: number;
  percentage: number; // 0..100, rounded to 1 decimal
  missingHours: number;
  missingPercentage: number;
  eligible: boolean;
}

/** Progress is calculated ONLY from co-op hours, per the 15-hour rule. */
export function calculateCoopProgress(coopHoursEarned: number): CoopProgress {
  const earned = Math.max(0, coopHoursEarned);
  const rawPercentage = (earned / COOP_GOAL_HOURS) * 100;
  const percentage = Math.round(Math.min(100, rawPercentage) * 10) / 10;
  const missingHours = Math.max(0, Math.round((COOP_GOAL_HOURS - earned) * 10) / 10);
  const missingPercentage = Math.round((100 - percentage) * 10) / 10;

  return {
    earned,
    goal: COOP_GOAL_HOURS,
    percentage,
    missingHours,
    missingPercentage: Math.max(0, missingPercentage),
    eligible: earned >= COOP_GOAL_HOURS,
  };
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
}

export function formatThaiDateTime(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

export function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}
