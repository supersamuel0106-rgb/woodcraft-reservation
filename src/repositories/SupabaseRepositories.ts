/**
 * Supabase 資料存取實作 (Supabase Repositories)
 */

import { supabase } from '../services/supabaseClient';
import { 
  IMachineRepository, 
  IReservationRepository, 
  IStudentRepository, 
  ICourseSessionRepository, 
  ISystemSettingsRepository 
} from './interfaces';
import { Machine, Reservation, Student, CourseSession, SystemSettings, ReservationStatus } from '../types';

export class SupabaseMachineRepository implements IMachineRepository {
  async getAll(): Promise<Machine[]> {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getById(id: string): Promise<Machine | null> {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateStatus(id: string, status: Machine['status']): Promise<Machine> {
    const { data, error } = await supabase
      .from('machines')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export class SupabaseReservationRepository implements IReservationRepository {
  async getAll(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      machineId: row.machine_id,
      machineName: row.machine_name,
      type: row.type,
      students: row.students,
      studentCount: row.student_count,
      durationMinutes: row.duration_minutes,
      timeSlotId: row.time_slot_id,
      startMinutes: row.start_minutes,
      endMinutes: row.end_minutes,
      startTimeFormatted: row.start_time_formatted,
      endTimeFormatted: row.end_time_formatted,
      status: row.status,
      email: row.email,
      createdAt: row.created_at,
      calledAt: row.called_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      cancelledAt: row.cancelled_at
    }));
  }

  async getById(id: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return {
      id: data.id,
      machineId: data.machine_id,
      machineName: data.machine_name,
      type: data.type,
      students: data.students,
      studentCount: data.student_count,
      durationMinutes: data.duration_minutes,
      timeSlotId: data.time_slot_id,
      startMinutes: data.start_minutes,
      endMinutes: data.end_minutes,
      startTimeFormatted: data.start_time_formatted,
      endTimeFormatted: data.end_time_formatted,
      status: data.status,
      email: data.email,
      createdAt: data.created_at,
      calledAt: data.called_at,
      startedAt: data.started_at,
      finishedAt: data.finished_at,
      cancelledAt: data.cancelled_at
    };
  }

  async create(res: Omit<Reservation, 'id'>): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        machine_id: res.machineId,
        machine_name: res.machineName,
        type: res.type,
        students: res.students,
        student_count: res.studentCount,
        duration_minutes: res.durationMinutes,
        time_slot_id: res.timeSlotId,
        start_minutes: res.startMinutes,
        end_minutes: res.endMinutes,
        start_time_formatted: res.startTimeFormatted,
        end_time_formatted: res.endTimeFormatted,
        status: res.status,
        email: res.email
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      machineId: data.machine_id,
      machineName: data.machine_name,
      type: data.type,
      students: data.students,
      studentCount: data.student_count,
      durationMinutes: data.duration_minutes,
      timeSlotId: data.time_slot_id,
      startMinutes: data.start_minutes,
      endMinutes: data.end_minutes,
      startTimeFormatted: data.start_time_formatted,
      endTimeFormatted: data.end_time_formatted,
      status: data.status,
      email: data.email,
      createdAt: data.created_at
    };
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const updates: Record<string, unknown> = { status };
    const now = new Date().toISOString();

    if (status === '等候報到') updates.called_at = now;
    if (status === '使用中') updates.started_at = now;
    if (status === '已完成') updates.finished_at = now;
    if (status === '已取消') updates.cancelled_at = now;

    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      machineId: data.machine_id,
      machineName: data.machine_name,
      type: data.type,
      students: data.students,
      studentCount: data.student_count,
      durationMinutes: data.duration_minutes,
      timeSlotId: data.time_slot_id,
      startMinutes: data.start_minutes,
      endMinutes: data.end_minutes,
      startTimeFormatted: data.start_time_formatted,
      endTimeFormatted: data.end_time_formatted,
      status: data.status,
      email: data.email,
      createdAt: data.created_at,
      calledAt: data.called_at,
      startedAt: data.started_at,
      finishedAt: data.finished_at,
      cancelledAt: data.cancelled_at
    };
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    return !error;
  }

  async clearCompletedByEmail(email: string): Promise<{ count: number; error: any }> {
    const { data, error } = await supabase
      .from('reservations')
      .delete()
      .eq('email', email)
      .in('status', ['已完成', '已取消'])
      .select();

    return { count: data ? data.length : 0, error };
  }
}

export class SupabaseStudentRepository implements IStudentRepository {
  async getAll(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      studentNumber: row.student_number,
      mail: row.mail,
      role: row.role
    }));
  }
}

export class SupabaseCourseSessionRepository implements ICourseSessionRepository {
  async getAll(): Promise<CourseSession[]> {
    const { data, error } = await supabase
      .from('course_sessions')
      .select('*')
      .order('session_id', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      sessionId: row.session_id,
      courseDate: row.course_date,
      startTime: row.start_time,
      endTime: row.end_time,
      isCurrent: row.is_current,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async setCurrentSession(id: string): Promise<void> {
    // 先將所有場次設為 false
    await supabase.from('course_sessions').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    // 將選定場次設為 true
    await supabase.from('course_sessions').update({ is_current: true }).eq('id', id);
  }

  async create(session: Omit<CourseSession, 'id'>): Promise<CourseSession> {
    const { data, error } = await supabase
      .from('course_sessions')
      .insert({
        session_id: session.sessionId,
        start_time: session.startTime,
        end_time: session.endTime,
        is_current: session.isCurrent,
        notes: session.notes
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      sessionId: data.session_id,
      courseDate: data.course_date,
      startTime: data.start_time,
      endTime: data.end_time,
      isCurrent: data.is_current,
      notes: data.notes
    };
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('course_sessions')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export class SupabaseSystemSettingsRepository implements ISystemSettingsRepository {
  async get(): Promise<SystemSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'DEFAULT')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      controlMode: data.control_mode,
      manualCourseDate: data.manual_course_date,
      manualCourseSession: data.manual_course_session,
      manualBookingOpenTime: data.manual_booking_open_time,
      manualBookingCloseTime: data.manual_booking_close_time,
      manualCourseStartTime: data.manual_course_start_time,
      manualCourseEndTime: data.manual_course_end_time,
      checkinGraceMinutes: data.checkin_grace_minutes,
      allowWalkInQueue: data.allow_walk_in_queue,
      courseStartTime: data.course_start_time,
      courseEndTime: data.course_end_time,
      updatedAt: data.updated_at
    };
  }

  async update(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (settings.controlMode !== undefined) updates.control_mode = settings.controlMode;
    if (settings.manualCourseDate !== undefined) updates.manual_course_date = settings.manualCourseDate;
    if (settings.manualCourseSession !== undefined) updates.manual_course_session = settings.manualCourseSession;
    if (settings.manualBookingOpenTime !== undefined) updates.manual_booking_open_time = settings.manualBookingOpenTime;
    if (settings.manualBookingCloseTime !== undefined) updates.manual_booking_close_time = settings.manualBookingCloseTime;
    if (settings.manualCourseStartTime !== undefined) updates.manual_course_start_time = settings.manualCourseStartTime;
    if (settings.manualCourseEndTime !== undefined) updates.manual_course_end_time = settings.manualCourseEndTime;
    if (settings.checkinGraceMinutes !== undefined) updates.checkin_grace_minutes = settings.checkinGraceMinutes;
    if (settings.allowWalkInQueue !== undefined) updates.allow_walk_in_queue = settings.allowWalkInQueue;

    const { data, error } = await supabase
      .from('system_settings')
      .update(updates)
      .eq('id', 'DEFAULT')
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      controlMode: data.control_mode,
      manualCourseDate: data.manual_course_date,
      manualCourseSession: data.manual_course_session,
      manualBookingOpenTime: data.manual_booking_open_time,
      manualBookingCloseTime: data.manual_booking_close_time,
      manualCourseStartTime: data.manual_course_start_time,
      manualCourseEndTime: data.manual_course_end_time,
      checkinGraceMinutes: data.checkin_grace_minutes,
      allowWalkInQueue: data.allow_walk_in_queue,
      courseStartTime: data.course_start_time,
      courseEndTime: data.course_end_time,
      updatedAt: data.updated_at
    };
  }
}
