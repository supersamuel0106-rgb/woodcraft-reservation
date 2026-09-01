/**
 * 工廠機台預約系統 v0.4 - TypeScript 型別定義
 * 
 * 映射自 AppSheet v0.4 資料結構與 Supabase PostgreSQL Table Schema
 */

// 機台狀態
export type MachineStatus = '空閒' | '使用中' | '等待報到';

// 預約申請方式
export type ReservationType = '時段預約' | '現場排隊';

// 預約紀錄使用狀態
export type ReservationStatus = 
  | '排隊中' 
  | '等待中' 
  | '等候報到' 
  | '使用中' 
  | '已完成' 
  | '已取消' 
  | '未報到' 
  | '逾時未到';

// 系統預約控制模式
export type ControlMode = '自動' | '手動';

/**
 * 機台資料結構 (Machines)
 * 對應 Table: 機台
 */
export interface Machine {
  id: string; // 機台名稱 (Primary Key: 帶鋸機, 推台鋸, 圓鋸機, 自動刨木機)
  name: string;
  status: MachineStatus;
  currentUserName?: string; // 目前使用同學 (Virtual)
  nextUserName?: string; // 下一位使用同學 (Virtual)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 修課學生 (Students)
 * 對應 Table: 修課名單
 */
export interface Student {
  id: string;
  name: string;
  studentNumber?: string;
  mail: string; // 對應 AppSheet USEREMAIL()
  role: 'student' | 'ta' | 'teacher' | 'admin';
}

/**
 * 預約起始時段 (TimeSlots)
 * 對應 Table: 預約起始時段 (10 分鐘 Slot 刻度)
 */
export interface TimeSlot {
  id: string; // e.g. "09:00", "09:10"
  startTime: string; // "09:00"
  startMinutes: number; // 540
  endTime: string; // "09:10"
}

/**
 * 預約紀錄 (Reservations)
 * 對應 Table: 預約紀錄
 */
export interface Reservation {
  id: string;
  machineId: string; // Ref -> 機台
  machineName: string;
  type: ReservationType;
  students: string[]; // 學生姓名清單 (EnumList)
  studentCount: number; // 學生人數
  durationMinutes: number; // 使用分鐘數
  timeSlotId?: string; // 預約起始時段ID
  startMinutes: number; // 起始分鐘 (從 00:00 起算)
  endMinutes: number; // 結束分鐘
  startTimeFormatted: string; // e.g. "09:20"
  endTimeFormatted: string; // e.g. "09:50"
  status: ReservationStatus;
  email: string; // 申請者 Email (USEREMAIL())
  createdAt: string;
  calledAt?: string; // 叫號時間
  startedAt?: string; // 開始使用時間
  finishedAt?: string; // 結束使用時間
  cancelledAt?: string; // 取消時間
}

/**
 * 課程場次 (CourseSessions)
 * 對應 Table: 課程場次
 */
export interface CourseSession {
  id: string;
  sessionId: string; // "時段一", "時段二", "時段三｜全時段"
  courseDate: string;
  startTime: string; // "09:00:00"
  endTime: string; // "12:00:00"
  isCurrent: boolean; // 是否目前場次 (Y/N)
  notes?: string; // 場次時間顯示
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 系統設定 (SystemSettings)
 * 對應 Table: 系統設定
 */
export interface SystemSettings {
  id: string;
  controlMode: ControlMode; // 自動 / 手動
  manualCourseDate?: string;
  manualCourseSession?: string;
  manualBookingOpenTime?: string;
  manualBookingCloseTime?: string;
  manualCourseStartTime?: string;
  manualCourseEndTime?: string;
  checkinGraceMinutes: number; // 報到寬限分鐘 (預設 5)
  allowWalkInQueue: boolean; // 現場排隊開放
  courseStartTime: string;
  courseEndTime: string;
  updatedAt?: string;
}

/**
 * 叫號通知紀錄 (NotificationLog)
 */
export interface NotificationLog {
  id: string;
  timestamp: string;
  recipientEmail: string;
  recipientName: string;
  machineName: string;
  subject: string;
  body: string;
}

/**
 * 時段矩陣狀態 (TimeMatrixSlot)
 */
export type SlotStatus = 'available' | 'selected' | 'occupied';

export interface MatrixHourRow {
  hourId: string; // "09:00", "10:00" ...
  slots: {
    minute: number; // 0, 10, 20, 30, 40, 50
    timeLabel: string; // "09:00", "09:10" ...
    status: SlotStatus; // ○ (available), ● (selected), ■ (occupied)
    reservationInfo?: string;
  }[];
}
