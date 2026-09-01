/**
 * 本地端 LocalStorage 資料存取實作 (離線/備用模式)
 */

import { 
  IMachineRepository, 
  IReservationRepository, 
  IStudentRepository, 
  ICourseSessionRepository, 
  ISystemSettingsRepository 
} from './interfaces';
import { Machine, Reservation, Student, CourseSession, SystemSettings, ReservationStatus } from '../types';

const STORAGE_KEYS = {
  MACHINES: 'factory_v04_machines',
  RESERVATIONS: 'factory_v04_reservations',
  STUDENTS: 'factory_v04_students',
  SESSIONS: 'factory_v04_sessions',
  SETTINGS: 'factory_v04_settings'
};

const DEFAULT_MACHINES: Machine[] = [
  { id: '帶鋸機', name: '帶鋸機', status: '空閒' },
  { id: '推台鋸', name: '推台鋸', status: '空閒' },
  { id: '圓鋸機', name: '圓鋸機', status: '空閒' },
  { id: '自動刨木機', name: '自動刨木機', status: '空閒' }
];

const DEFAULT_STUDENTS: Student[] = [
  { id: '1', name: '李信恩', studentNumber: 'S1049792', mail: 'supersamuel0106@gmail.com', role: 'admin' },
  { id: '2', name: '王小明', studentNumber: 'S1049793', mail: 'wang.xiaoming@example.com', role: 'student' },
  { id: '3', name: '張偉強', studentNumber: 'S1049794', mail: 'chang.weiqiang@example.com', role: 'student' },
  { id: '4', name: '陳雅婷', studentNumber: 'S1049795', mail: 'chen.yating@example.com', role: 'student' },
  { id: '5', name: '林志豪', studentNumber: 'S1049796', mail: 'lin.zhihao@example.com', role: 'student' }
];

const DEFAULT_SESSIONS: CourseSession[] = [
  { id: '1', sessionId: '時段一', courseDate: '2026-08-31', startTime: '09:00:00', endTime: '12:00:00', isCurrent: false, notes: '時段一：09:00－12:00' },
  { id: '2', sessionId: '時段二', courseDate: '2026-08-31', startTime: '14:00:00', endTime: '17:00:00', isCurrent: false, notes: '時段二：14:00－17:00' },
  { id: '3', sessionId: '時段三｜全時段', courseDate: '2026-08-31', startTime: '09:00:00', endTime: '17:00:00', isCurrent: true, notes: '時段三：全時段' }
];

const DEFAULT_SETTINGS: SystemSettings = {
  id: 'DEFAULT',
  controlMode: '自動',
  checkinGraceMinutes: 5,
  allowWalkInQueue: true,
  courseStartTime: new Date().toISOString(),
  courseEndTime: new Date().toISOString()
};

export class LocalStorageMachineRepository implements IMachineRepository {
  async getAll(): Promise<Machine[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.MACHINES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(DEFAULT_MACHINES));
      return DEFAULT_MACHINES;
    }
    return JSON.parse(raw);
  }

  async getById(id: string): Promise<Machine | null> {
    const all = await this.getAll();
    return all.find(m => m.id === id) || null;
  }

  async updateStatus(id: string, status: Machine['status']): Promise<Machine> {
    const all = await this.getAll();
    const target = all.find(m => m.id === id);
    if (!target) throw new Error('Machine not found');
    target.status = status;
    target.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(all));
    return target;
  }
}

export class LocalStorageReservationRepository implements IReservationRepository {
  async getAll(): Promise<Reservation[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  async getById(id: string): Promise<Reservation | null> {
    const all = await this.getAll();
    return all.find(r => r.id === id) || null;
  }

  async create(res: Omit<Reservation, 'id'>): Promise<Reservation> {
    const all = await this.getAll();
    const newRes: Reservation = {
      ...res,
      id: `RES_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    all.unshift(newRes);
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(all));
    return newRes;
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const all = await this.getAll();
    const target = all.find(r => r.id === id);
    if (!target) throw new Error('Reservation not found');
    target.status = status;
    const now = new Date().toISOString();
    if (status === '等候報到') target.calledAt = now;
    if (status === '使用中') target.startedAt = now;
    if (status === '已完成') target.finishedAt = now;
    if (status === '已取消') target.cancelledAt = now;
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(all));
    return target;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(filtered));
    return true;
  }
}

export class LocalStorageStudentRepository implements IStudentRepository {
  async getAll(): Promise<Student[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    return JSON.parse(raw);
  }
}

export class LocalStorageCourseSessionRepository implements ICourseSessionRepository {
  async getAll(): Promise<CourseSession[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
      return DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  }

  async setCurrentSession(id: string): Promise<void> {
    const all = await this.getAll();
    all.forEach(s => s.isCurrent = (s.id === id));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(all));
  }

  async create(session: Omit<CourseSession, 'id'>): Promise<CourseSession> {
    const all = await this.getAll();
    const newSession: CourseSession = {
      ...session,
      id: `SESS_${Date.now()}`
    };
    all.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(all));
    return newSession;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
    return true;
  }
}

export class LocalStorageSystemSettingsRepository implements ISystemSettingsRepository {
  async get(): Promise<SystemSettings> {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  }

  async update(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.get();
    const updated = { ...current, ...settings, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }
}
