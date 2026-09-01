/**
 * 工廠機台預約系統 v0.4 - 領域商業邏輯 (Domain Rules)
 * 
 * 包含：
 * 1. 人數與使用時長計算公式
 * 2. 自動模式 (固定週三 09:00~12:00) 與手動模式時間計算
 * 3. 24 小時前時段預約 vs 課程開始現場排隊之時間階段判定
 * 4. 時段衝突判定與現場排隊動態開始時間推算
 */

import { Reservation, ReservationStatus, MachineStatus, SystemSettings } from '../types';

/**
 * 1. 人數與使用時間計算公式
 * AppSheet Formula: =IF(COUNT([學生姓名]) > 0, 20 + (COUNT([學生姓名]) - 1) * 10, 0)
 */
export function calculateUsageMinutes(studentCount: number): number {
  if (studentCount <= 0) return 0;
  return 20 + (studentCount - 1) * 10;
}

/**
 * 時間字串轉分鐘數 (HH:MM ➔ Minutes from 00:00)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hh = parseInt(parts[0], 10) || 0;
  const mm = parseInt(parts[1], 10) || 0;
  return hh * 60 + mm;
}

/**
 * 分鐘數轉時間字串 (Minutes ➔ HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mm = (minutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * 2. 計算有效課程時間 (Effective Course Times)
 * 
 * - 自動模式：計算下一個（或當前）週三 09:00 ~ 12:00
 * - 手動模式：使用設定的自訂開始與結束時間
 */
export function getEffectiveCourseTimes(settings: SystemSettings | null): {
  startTime: Date;
  endTime: Date;
  openBookingTime: Date; // 開始前 24 小時開放預約
  isAuto: boolean;
} {
  const isAuto = !settings || settings.controlMode === '自動';
  const now = new Date();

  if (isAuto) {
    // 計算下一個週三 (Wednesday, day 3 in JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed...)
    const currentDay = now.getDay();
    let daysUntilWed = (3 - currentDay + 7) % 7;

    // 若今天是週三且已超過中午 12:00，則推算至下週三
    if (daysUntilWed === 0) {
      const todayNoon = new Date(now);
      todayNoon.setHours(12, 0, 0, 0);
      if (now >= todayNoon) {
        daysUntilWed = 7;
      }
    }

    const targetWed = new Date(now);
    targetWed.setDate(now.getDate() + daysUntilWed);

    const start = new Date(targetWed);
    start.setHours(9, 0, 0, 0);

    const end = new Date(targetWed);
    end.setHours(12, 0, 0, 0);

    const openTime = new Date(start);
    openTime.setDate(openTime.getDate() - 1); // 課程開始前 24 小時

    return { startTime: start, endTime: end, openBookingTime: openTime, isAuto: true };
  } else {
    // 手動模式
    const start = settings.manualCourseStartTime ? new Date(settings.manualCourseStartTime) : new Date(settings.courseStartTime);
    const end = settings.manualCourseEndTime ? new Date(settings.manualCourseEndTime) : new Date(settings.courseEndTime);
    const openTime = new Date(start.getTime() - 24 * 60 * 60 * 1000);

    return { startTime: start, endTime: end, openBookingTime: openTime, isAuto: false };
  }
}

/**
 * 3. 預約開放階段判定 (Booking Phase)
 * 
 * 規則：
 * - 課程開始前 24 小時 (openBookingTime ~ startTime)：只能「時段預約」
 * - 課程開始時 (startTime ~ endTime)：只能「現場排隊」
 * - 課程開始 24 小時前：尚未開放
 * - 課程結束後：已截止
 */
export type BookingPhaseType = 'NOT_OPEN' | 'SLOT_ONLY' | 'QUEUE_ONLY' | 'CLOSED';

export interface BookingPhaseInfo {
  phase: BookingPhaseType;
  title: string;
  description: string;
  allowedType: '時段預約' | '現場排隊' | 'NONE';
  effectiveStart: Date;
  effectiveEnd: Date;
  openBookingTime: Date;
}

export function getCurrentBookingPhase(settings: SystemSettings | null): BookingPhaseInfo {
  const { startTime, endTime, openBookingTime } = getEffectiveCourseTimes(settings);
  const now = new Date();

  // 1. 課程已結束
  if (now >= endTime) {
    return {
      phase: 'CLOSED',
      title: '本次課程已結束',
      description: `課程已於 ${formatDateTime(endTime)} 結束，不再受理預約。`,
      allowedType: 'NONE',
      effectiveStart: startTime,
      effectiveEnd: endTime,
      openBookingTime
    };
  }

  // 2. 課程進行中 (startTime ~ endTime) ➔ 只能「現場排隊」
  if (now >= startTime && now < endTime) {
    return {
      phase: 'QUEUE_ONLY',
      title: '課程進行中（開放現場排隊）',
      description: '課程已開始，系統目前僅開放「現場排隊」，由系統依機台現況即時叫號！',
      allowedType: '現場排隊',
      effectiveStart: startTime,
      effectiveEnd: endTime,
      openBookingTime
    };
  }

  // 3. 課程開始前 24 小時內 (openBookingTime ~ startTime) ➔ 只能「時段預約」
  if (now >= openBookingTime && now < startTime) {
    return {
      phase: 'SLOT_ONLY',
      title: '課程前 24 小時（開放時段預約）',
      description: `即將於 ${formatDateTime(startTime)} 開始上課，目前僅開放「時段預約」！`,
      allowedType: '時段預約',
      effectiveStart: startTime,
      effectiveEnd: endTime,
      openBookingTime
    };
  }

  // 4. 課程開始 24 小時前 ➔ 尚未開放
  return {
    phase: 'NOT_OPEN',
    title: '預約尚未開放',
    description: `將於課程開始前 24 小時（${formatDateTime(openBookingTime)}）正式開放時段預約。`,
    allowedType: 'NONE',
    effectiveStart: startTime,
    effectiveEnd: endTime,
    openBookingTime
  };
}

/**
 * 格式化日期時間
 */
export function formatDateTime(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

/**
 * 4. 時段衝突判定 (Interval Overlap Check)
 */
export function hasReservationConflict(
  reservations: Reservation[],
  machineId: string,
  startMin: number,
  durationMin: number,
  ignoreReservationId?: string
): boolean {
  const endMin = startMin + durationMin;

  return reservations.some(r => {
    if (r.machineId !== machineId) return false;
    if (r.id === ignoreReservationId) return false;
    if (r.status === '已取消' || r.status === '已完成' || r.status === '未報到' || r.status === '逾時未到') return false;

    // 半開區間重疊判定
    return r.startMinutes < endMin && r.endMinutes > startMin;
  });
}

/**
 * 5. 現場排隊動態開始時間推算
 */
export function calculateDynamicQueueStart(
  reservations: Reservation[],
  machineId: string,
  durationMinutes: number = 20,
  courseEndMinutes: number = 1020 // 預設 17:00
): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const roundedNow = Math.ceil(currentMinutes / 10) * 10;

  const activeReservations = reservations.filter(r => 
    r.machineId === machineId && 
    (r.status === '排隊中' || r.status === '等待中' || r.status === '等候報到' || r.status === '使用中')
  );

  let baselineStart = roundedNow;
  if (activeReservations.length > 0) {
    const maxEnd = Math.max(...activeReservations.map(r => r.endMinutes));
    baselineStart = Math.max(roundedNow, maxEnd);
  }

  let candidateStart = baselineStart;
  while (candidateStart + durationMinutes <= courseEndMinutes) {
    const conflict = hasReservationConflict(reservations, machineId, candidateStart, durationMinutes);
    if (!conflict) {
      return candidateStart;
    }
    candidateStart += 10;
  }

  return baselineStart;
}

/**
 * 6. 尋找機台之下一位排隊等待者
 */
export function getNextQueueWaiter(
  reservations: Reservation[],
  machineId: string
): Reservation | undefined {
  return reservations
    .filter(r => 
      r.machineId === machineId && 
      (r.status === '排隊中' || r.status === '等待中')
    )
    .sort((a, b) => a.startMinutes - b.startMinutes)[0];
}

/**
 * 7. 動態背景色配色規範 (Format Rules)
 */
export function getMachineColor(status: MachineStatus): {
  bgClass: string;
  badgeClass: string;
  badgeText: string;
  hexBg: string;
} {
  switch (status) {
    case '使用中':
      return {
        bgClass: 'status-busy',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        badgeText: '🔴 使用中',
        hexBg: '#FFEBEE'
      };
    case '等待報到':
      return {
        bgClass: 'status-waiting',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        badgeText: '🟡 等候報到',
        hexBg: '#FFF8E1'
      };
    case '空閒':
    default:
      return {
        bgClass: 'status-idle',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badgeText: '🟢 空閒',
        hexBg: '#E8F5E9'
      };
  }
}
