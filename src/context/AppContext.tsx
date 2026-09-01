/**
 * 應用程式全域 Context (AppContext) - 純手機 Mobile-Only 版本
 * 
 * 包含：
 * 1. 支援依 reservationId 精準啟動 / 結束預約
 * 2. 現場排隊動態前拉機制 (Queue Cascade Advance)
 * 3. 機台顏色狀態動態流轉：空閒(綠) ➔ 等待報到(黃) ➔ 使用中(紅)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Machine, 
  Reservation, 
  Student, 
  CourseSession, 
  SystemSettings, 
  NotificationLog, 
  ReservationType, 
  MachineStatus, 
  ReservationStatus 
} from '../types';
import { 
  SupabaseMachineRepository, 
  SupabaseReservationRepository, 
  SupabaseStudentRepository, 
  SupabaseCourseSessionRepository, 
  SupabaseSystemSettingsRepository 
} from '../repositories/SupabaseRepositories';
import { 
  LocalStorageMachineRepository, 
  LocalStorageReservationRepository, 
  LocalStorageStudentRepository, 
  LocalStorageCourseSessionRepository, 
  LocalStorageSystemSettingsRepository 
} from '../repositories/LocalStorageRepositories';
import { 
  calculateUsageMinutes, 
  hasReservationConflict, 
  getNextQueueWaiter, 
  timeToMinutes, 
  minutesToTime,
  calculateDynamicQueueStart
} from '../domain/rules';

const AUTH_STORAGE_KEY = 'factory_v04_logged_in_email';

interface AppContextType {
  machines: Machine[];
  reservations: Reservation[];
  students: Student[];
  courseSessions: CourseSession[];
  systemSettings: SystemSettings | null;
  notifications: NotificationLog[];
  activeUser: Student;
  isLiveSupabase: boolean;
  isLoading: boolean;
  activeTab: 'machines' | 'reservations' | 'courses' | 'settings';
  isLoggedIn: boolean;
  
  setActiveTab: (tab: 'machines' | 'reservations' | 'courses' | 'settings') => void;
  setActiveUser: (student: Student) => void;
  
  loginWithEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;

  createReservation: (data: {
    machineId: string;
    type: ReservationType;
    students: string[];
    timeSlotId?: string;
  }) => Promise<{ success: boolean; message: string }>;

  startMachineUsage: (machineId: string, reservationId?: string) => Promise<void>;
  finishMachineUsage: (machineId: string, reservationId?: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;
  clearCompletedReservations: () => Promise<{ success: boolean; message: string; count: number }>;
  
  setCurrentCourseSession: (sessionId: string) => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  
  refreshData: () => Promise<void>;
}

const supabaseMachineRepo = new SupabaseMachineRepository();
const supabaseResRepo = new SupabaseReservationRepository();
const supabaseStudentRepo = new SupabaseStudentRepository();
const supabaseSessionRepo = new SupabaseCourseSessionRepository();
const supabaseSettingsRepo = new SupabaseSystemSettingsRepository();

const localMachineRepo = new LocalStorageMachineRepository();
const localResRepo = new LocalStorageReservationRepository();
const localStudentRepo = new LocalStorageStudentRepository();
const localSessionRepo = new LocalStorageCourseSessionRepository();
const localSettingsRepo = new LocalStorageSystemSettingsRepository();

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  
  const [activeUser, setActiveUser] = useState<Student>({
    id: '1',
    name: '李信恩',
    mail: 'supersamuel0106@gmail.com',
    role: 'admin'
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'machines' | 'reservations' | 'courses' | 'settings'>('machines');
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 刷新所有資料
  const refreshData = useCallback(async () => {
    try {
      const [m, r, s, sess, sett] = await Promise.all([
        supabaseMachineRepo.getAll(),
        supabaseResRepo.getAll(),
        supabaseStudentRepo.getAll(),
        supabaseSessionRepo.getAll(),
        supabaseSettingsRepo.get()
      ]);

      setIsLiveSupabase(true);
      processAndSetData(m, r, s, sess, sett);
    } catch (err) {
      console.warn('Supabase 連線失敗，切換至 LocalStorage 備用模式:', err);
      setIsLiveSupabase(false);

      const [m, r, s, sess, sett] = await Promise.all([
        localMachineRepo.getAll(),
        localResRepo.getAll(),
        localStudentRepo.getAll(),
        localSessionRepo.getAll(),
        localSettingsRepo.get()
      ]);

      processAndSetData(m, r, s, sess, sett);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 計算並套用機台狀態與自動登入檢查
  const processAndSetData = (
    rawMachines: Machine[],
    rawReservations: Reservation[],
    rawStudents: Student[],
    rawSessions: CourseSession[],
    rawSettings: SystemSettings
  ) => {
    const updatedMachines = rawMachines.map(mac => {
      const inUseRes = rawReservations.find(r => r.machineId === mac.id && r.status === '使用中');
      const waitingCheckinRes = rawReservations.find(r => r.machineId === mac.id && r.status === '等候報到');
      const nextWaiter = getNextQueueWaiter(rawReservations, mac.id);

      let computedStatus: MachineStatus = '空閒';
      if (inUseRes) computedStatus = '使用中';
      else if (waitingCheckinRes) computedStatus = '等待報到';

      return {
        ...mac,
        status: computedStatus,
        currentUserName: inUseRes ? inUseRes.students.join(', ') : undefined,
        nextUserName: waitingCheckinRes 
          ? waitingCheckinRes.students.join(', ') 
          : nextWaiter 
          ? nextWaiter.students.join(', ') 
          : undefined
      };
    });

    setMachines(updatedMachines);
    setReservations(rawReservations);
    setStudents(rawStudents);
    setCourseSessions(rawSessions);
    setSystemSettings(rawSettings);

    const savedEmail = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedEmail && rawStudents.length > 0) {
      const matched = rawStudents.find(s => s.mail.toLowerCase() === savedEmail.trim().toLowerCase());
      if (matched) {
        setActiveUser(matched);
        setIsLoggedIn(true);
      }
    }
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(() => {
      refreshData();
    }, 8000);
    return () => clearInterval(timer);
  }, [refreshData]);

  // Email 驗證登入
  const loginWithEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    const trimmed = email.trim().toLowerCase();
    const matched = students.find(s => s.mail.toLowerCase() === trimmed);

    if (!matched) {
      return {
        success: false,
        message: `驗證失敗：【${email}】未出現在修課名單中！請確認輸入無誤，或向老師/助教確認。`
      };
    }

    setActiveUser(matched);
    setIsLoggedIn(true);
    localStorage.setItem(AUTH_STORAGE_KEY, matched.mail);
    return {
      success: true,
      message: `歡迎回來，${matched.name} ${matched.role === 'admin' ? '老師' : '同學'}！`
    };
  };

  // 登出
  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsLoggedIn(false);
  };

  // 新增預約 / 現場排隊
  const createReservation = async (data: {
    machineId: string;
    type: ReservationType;
    students: string[];
    timeSlotId?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const targetMachine = machines.find(m => m.id === data.machineId);
    if (!targetMachine) return { success: false, message: '找不到指定機台' };
    if (data.students.length === 0) return { success: false, message: '請至少選擇一位學生' };

    const duration = calculateUsageMinutes(data.students.length);
    let startMin = 540;
    let slotId: string | undefined = data.timeSlotId;

    if (data.type === '時段預約') {
      if (!slotId) return { success: false, message: '請選擇預約開始時段' };
      startMin = timeToMinutes(slotId);

      if (hasReservationConflict(reservations, data.machineId, startMin, duration)) {
        return {
          success: false,
          message: `時段 ${slotId} 至 ${minutesToTime(startMin + duration)} 已被占用，請選擇其他時段！`
        };
      }
    } else {
      startMin = calculateDynamicQueueStart(reservations, data.machineId, duration);
      slotId = undefined;
    }

    const endMin = startMin + duration;

    const newResPayload: Omit<Reservation, 'id'> = {
      machineId: data.machineId,
      machineName: targetMachine.name,
      type: data.type,
      students: data.students,
      studentCount: data.students.length,
      durationMinutes: duration,
      timeSlotId: slotId,
      startMinutes: startMin,
      endMinutes: endMin,
      startTimeFormatted: minutesToTime(startMin),
      endTimeFormatted: minutesToTime(endMin),
      status: '排隊中',
      email: activeUser.mail,
      createdAt: new Date().toISOString()
    };

    try {
      if (isLiveSupabase) {
        await supabaseResRepo.create(newResPayload);
      } else {
        await localResRepo.create(newResPayload);
      }
      await refreshData();
      return {
        success: true,
        message: `成功建立【${data.type}】！預約時段：${minutesToTime(startMin)} ～ ${minutesToTime(endMin)}`
      };
    } catch (err: any) {
      return { success: false, message: `預約失敗：${err.message || '資料庫錯誤'}` };
    }
  };

  // 開始使用
  const startMachineUsage = async (machineId: string, reservationId?: string) => {
    let targetRes: Reservation | undefined;

    if (reservationId) {
      targetRes = reservations.find(r => r.id === reservationId);
    } else {
      targetRes = reservations.find(r => 
        r.machineId === machineId && 
        (r.status === '等候報到' || r.status === '排隊中' || r.status === '等待中')
      );
    }

    if (targetRes) {
      const realMachineId = targetRes.machineId || machineId;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const newEndMinutes = nowMinutes + targetRes.durationMinutes;

      if (isLiveSupabase) {
        await supabaseResRepo.updateStatus(targetRes.id, '使用中');
        await supabaseResRepo.updateTime(targetRes.id, {
          start_minutes: nowMinutes,
          end_minutes: newEndMinutes,
          start_time_formatted: minutesToTime(nowMinutes),
          end_time_formatted: minutesToTime(newEndMinutes)
        });
        await supabaseMachineRepo.updateStatus(realMachineId, '使用中');
      } else {
        await localResRepo.updateStatus(targetRes.id, '使用中');
        await localMachineRepo.updateStatus(realMachineId, '使用中');
      }
      await refreshData();
    }
  };

  // 結束使用
  const finishMachineUsage = async (machineId: string, reservationId?: string) => {
    let targetResId = reservationId;
    if (!targetResId) {
      const cur = reservations.find(r => r.machineId === machineId && r.status === '使用中');
      targetResId = cur?.id;
    }

    if (targetResId) {
      if (isLiveSupabase) {
        await supabaseResRepo.updateStatus(targetResId, '已完成');
      } else {
        await localResRepo.updateStatus(targetResId, '已完成');
      }
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const remainingQueue = reservations
      .filter(r => 
        r.machineId === machineId && 
        r.id !== targetResId &&
        (r.status === '等候報到' || r.status === '排隊中' || r.status === '等待中')
      )
      .sort((a, b) => a.startMinutes - b.startMinutes);

    if (remainingQueue.length > 0) {
      let runningStartMin = nowMinutes;

      for (let i = 0; i < remainingQueue.length; i++) {
        const item = remainingQueue[i];
        const newStartMin = runningStartMin;
        const newEndMin = newStartMin + item.durationMinutes;

        const isFirst = i === 0;
        const newStatus: ReservationStatus = isFirst ? '等候報到' : '排隊中';

        if (isLiveSupabase) {
          await supabaseResRepo.updateStatus(item.id, newStatus);
          await supabaseResRepo.updateTime(item.id, {
            start_minutes: newStartMin,
            end_minutes: newEndMin,
            start_time_formatted: minutesToTime(newStartMin),
            end_time_formatted: minutesToTime(newEndMin)
          });
        } else {
          await localResRepo.updateStatus(item.id, newStatus);
        }

        if (isFirst) {
          const notif: NotificationLog = {
            id: `NOTIF_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('zh-TW'),
            recipientEmail: item.email,
            recipientName: item.students[0],
            machineName: item.machineName,
            subject: '【叫號通知】輪到您使用機台了！',
            body: `親愛的 ${item.students.join(', ')} 同學：您預約的【${item.machineName}】目前已提早空出，時段已更新為 ${minutesToTime(newStartMin)} ～ ${minutesToTime(newEndMin)}，請於 5 分鐘內前往工廠報到使用！`
          };
          setNotifications(prev => [notif, ...prev]);
        }

        runningStartMin = newEndMin;
      }

      if (isLiveSupabase) {
        await supabaseMachineRepo.updateStatus(machineId, '等待報到');
      } else {
        await localMachineRepo.updateStatus(machineId, '等待報到');
      }
    } else {
      if (isLiveSupabase) {
        await supabaseMachineRepo.updateStatus(machineId, '空閒');
      } else {
        await localMachineRepo.updateStatus(machineId, '空閒');
      }
    }

    await refreshData();
  };

  // 取消預約
  const cancelReservation = async (reservationId: string) => {
    const targetRes = reservations.find(r => r.id === reservationId);
    if (isLiveSupabase) {
      await supabaseResRepo.updateStatus(reservationId, '已取消');
    } else {
      await localResRepo.updateStatus(reservationId, '已取消');
    }

    if (targetRes) {
      const remain = reservations
        .filter(r => r.machineId === targetRes.machineId && r.id !== reservationId && (r.status === '排隊中' || r.status === '等候報到'))
        .sort((a, b) => a.startMinutes - b.startMinutes);
      
      if (remain.length === 0) {
        if (isLiveSupabase) await supabaseMachineRepo.updateStatus(targetRes.machineId, '空閒');
      }
    }

    await refreshData();
  };

  // 清除當前登入者已完成與已取消的預約紀錄 (從資料庫永久刪除)
  const clearCompletedReservations = async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
      let count = 0;
      if (isLiveSupabase) {
        const res = await supabaseResRepo.clearCompletedByEmail(activeUser.mail);
        if (res.error) throw res.error;
        count = res.count;
      }
      await refreshData();
      return {
        success: true,
        message: `已成功從資料庫清除 ${count} 筆已完成預約紀錄！`,
        count
      };
    } catch (err: any) {
      return {
        success: false,
        message: `清除失敗：${err.message || '資料庫操作錯誤'}`,
        count: 0
      };
    }
  };

  // 切換當前課程場次
  const setCurrentCourseSession = async (sessionId: string) => {
    if (isLiveSupabase) {
      await supabaseSessionRepo.setCurrentSession(sessionId);
    } else {
      await localSessionRepo.setCurrentSession(sessionId);
    }
    await refreshData();
  };

  // 更新系統設定
  const updateSettings = async (settings: Partial<SystemSettings>) => {
    if (isLiveSupabase) {
      await supabaseSettingsRepo.update(settings);
    } else {
      await localSettingsRepo.update(settings);
    }
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      machines,
      reservations,
      students,
      courseSessions,
      systemSettings,
      notifications,
      activeUser,
      isLiveSupabase,
      isLoading,
      activeTab,
      isLoggedIn,
      setActiveTab,
      setActiveUser,
      loginWithEmail,
      logout,
      createReservation,
      startMachineUsage,
      finishMachineUsage,
      cancelReservation,
      clearCompletedReservations,
      setCurrentCourseSession,
      updateSettings,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
