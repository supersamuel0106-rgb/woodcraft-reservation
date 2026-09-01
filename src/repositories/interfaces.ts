/**
 * 資料存取介面定義 (Repository Interfaces)
 */

import { Machine, Reservation, Student, CourseSession, SystemSettings, ReservationStatus } from '../types';

export interface IMachineRepository {
  getAll(): Promise<Machine[]>;
  getById(id: string): Promise<Machine | null>;
  updateStatus(id: string, status: Machine['status']): Promise<Machine>;
}

export interface IReservationRepository {
  getAll(): Promise<Reservation[]>;
  getById(id: string): Promise<Reservation | null>;
  create(reservation: Omit<Reservation, 'id'>): Promise<Reservation>;
  updateStatus(id: string, status: ReservationStatus): Promise<Reservation>;
  delete(id: string): Promise<boolean>;
}

export interface IStudentRepository {
  getAll(): Promise<Student[]>;
}

export interface ICourseSessionRepository {
  getAll(): Promise<CourseSession[]>;
  setCurrentSession(id: string): Promise<void>;
  create(session: Omit<CourseSession, 'id'>): Promise<CourseSession>;
  delete(id: string): Promise<boolean>;
}

export interface ISystemSettingsRepository {
  get(): Promise<SystemSettings>;
  update(settings: Partial<SystemSettings>): Promise<SystemSettings>;
}
