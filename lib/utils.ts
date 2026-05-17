import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 現在の年度を返す（4月始まり）
export function getCurrentFiscalYear(date: Date = new Date()): number {
  const month = date.getMonth() + 1;
  return month >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

// 年度の開始・終了日
export function getFiscalYearRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, 3, 1),       // 4月1日
    end: new Date(year + 1, 2, 31),    // 翌3月31日
  };
}

const DAY_NAMES_JA = ["日", "月", "火", "水", "木", "金", "土"];
export function dayOfWeekName(dow: number): string {
  return DAY_NAMES_JA[dow] ?? "";
}

// "09:00:00" → "09:00"
export function formatTime(t: string): string {
  return t.slice(0, 5);
}

// 時間文字列 "09:00" → 分数
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 開始〜終了の分数差
export function durationMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

// 分 → "Xh Ym" 表示
export function formatMinutes(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${sign}${h}h` : `${sign}${h}h${m}m`;
}

// 標準偏差
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
