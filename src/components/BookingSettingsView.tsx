/**
 * 預約設定視圖元件 (BookingSettingsView)
 * 
 * 1. 自動模式：系統自動計算為每週三 09:00 ~ 12:00
 * 2. 手動模式：允許自訂調整課程開始時間與結束時間
 * 3. 解決背景輪詢導致手動模式跳回自動模式的問題 (Form Dirty State 保護)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Minus, Plus, Save, Info } from 'lucide-react';
import { ControlMode } from '../types';
import { getEffectiveCourseTimes } from '../domain/rules';

export const BookingSettingsView: React.FC = () => {
  const { systemSettings, updateSettings } = useApp();

  const [controlMode, setControlMode] = useState<ControlMode>('自動');
  const [courseStartTime, setCourseStartTime] = useState('');
  const [courseEndTime, setCourseEndTime] = useState('');
  const [graceMinutes, setGraceMinutes] = useState<number>(5);
  const [allowWalkIn, setAllowWalkIn] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // 用於追蹤使用者是否正在編輯表單，避免被每 8 秒的背景輪詢洗掉草稿
  const isDirtyRef = useRef(false);
  const isInitializedRef = useRef(false);

  const formatToInput = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // 僅在初次載入或未編輯狀態下載入 Database 設定
  useEffect(() => {
    if (systemSettings && (!isInitializedRef.current || !isDirtyRef.current)) {
      const mode = systemSettings.controlMode || '自動';
      setControlMode(mode);
      setGraceMinutes(systemSettings.checkinGraceMinutes || 5);
      setAllowWalkIn(systemSettings.allowWalkInQueue ?? true);

      const effective = getEffectiveCourseTimes(systemSettings);
      setCourseStartTime(formatToInput(effective.startTime));
      setCourseEndTime(formatToInput(effective.endTime));

      isInitializedRef.current = true;
    }
  }, [systemSettings]);

  // 切換模式時的處理 (標記為 isDirty 避免被背景輪詢覆蓋)
  const handleModeChange = (newMode: ControlMode) => {
    isDirtyRef.current = true;
    setControlMode(newMode);

    const mockSettings = { ...(systemSettings || {}), controlMode: newMode } as any;
    const effective = getEffectiveCourseTimes(mockSettings);
    
    setCourseStartTime(formatToInput(effective.startTime));
    setCourseEndTime(formatToInput(effective.endTime));
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    isDirtyRef.current = true;
    if (type === 'start') setCourseStartTime(value);
    else setCourseEndTime(value);
  };

  const handleGraceChange = (delta: number) => {
    isDirtyRef.current = true;
    setGraceMinutes(prev => Math.max(1, prev + delta));
  };

  const handleWalkInChange = (value: boolean) => {
    isDirtyRef.current = true;
    setAllowWalkIn(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        controlMode,
        manualCourseStartTime: controlMode === '手動' ? new Date(courseStartTime).toISOString() : undefined,
        manualCourseEndTime: controlMode === '手動' ? new Date(courseEndTime).toISOString() : undefined,
        courseStartTime: new Date(courseStartTime).toISOString(),
        courseEndTime: new Date(courseEndTime).toISOString(),
        checkinGraceMinutes: graceMinutes,
        allowWalkInQueue: allowWalkIn
      });

      isDirtyRef.current = false; // 儲存成功後重設 dirty 狀態
      alert('預約設定已成功儲存並同步至 Supabase！');
    } catch (err: any) {
      alert(`儲存失敗：${err.message || '連線異常'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    isDirtyRef.current = false;
    if (systemSettings) {
      const mode = systemSettings.controlMode || '自動';
      setControlMode(mode);
      setGraceMinutes(systemSettings.checkinGraceMinutes || 5);
      setAllowWalkIn(systemSettings.allowWalkInQueue ?? true);

      const effective = getEffectiveCourseTimes(systemSettings);
      setCourseStartTime(formatToInput(effective.startTime));
      setCourseEndTime(formatToInput(effective.endTime));
    }
    alert('已還原為目前資料庫之設定！');
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6 max-w-2xl mx-auto">
      {/* 預約控制模式切換 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          預約控制模式：
        </label>
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            type="button"
            className={`py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              controlMode === '自動' 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => handleModeChange('自動')}
          >
            <span>⚡ 自動模式 (固定週三)</span>
          </button>
          <button
            type="button"
            className={`py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              controlMode === '手動' 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => handleModeChange('手動')}
          >
            <span>✏️ 手動模式 (自訂時段)</span>
          </button>
        </div>
      </div>

      {/* 模式提示說明 */}
      {controlMode === '自動' ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info size={15} className="text-blue-600" />
            <span>自動模式運作規則：</span>
          </div>
          <p className="text-blue-800 leading-relaxed">
            系統固定設定課程時間為<strong>「每週三上午 09:00 到 中午 12:00」</strong>。<br />
            • 課程開始前 24 小時（每週二 09:00 起）：僅開放<strong>「時段預約」</strong>。<br />
            • 課程開始時（每週三 09:00 起）：僅開放<strong>「現場排隊」</strong>。
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info size={15} className="text-amber-600" />
            <span>手動模式運作規則：</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            允許老師/管理員自由調整下方的<strong>「課程開始時間」</strong>與<strong>「課程結束時間」</strong>。<br />
            • 課程開始前 24 小時內：開放<strong>「時段預約」</strong>。<br />
            • 課程開始後：開放<strong>「現場排隊」</strong>。
          </p>
        </div>
      )}

      {/* 課程開始時間 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700">
            課程開始時間
          </label>
          {controlMode === '自動' ? (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
              系統自動推算 (週三 09:00)
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
              手動自訂模式 (點擊修改時間)
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="datetime-local"
            value={courseStartTime}
            disabled={controlMode === '自動'}
            onChange={e => handleTimeChange('start', e.target.value)}
            className={`w-full border-2 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:outline-none transition-colors ${
              controlMode === '自動'
                ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                : 'border-blue-600 focus:border-blue-700 shadow-xs'
            }`}
          />
          <Calendar size={18} className={`absolute right-3 top-3.5 pointer-events-none ${controlMode === '自動' ? 'text-slate-400' : 'text-blue-600'}`} />
        </div>
      </div>

      {/* 課程結束時間 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700">
            課程結束時間
          </label>
          {controlMode === '自動' ? (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
              系統自動推算 (週三 12:00)
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
              手動自訂模式 (點擊修改時間)
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="datetime-local"
            value={courseEndTime}
            disabled={controlMode === '自動'}
            onChange={e => handleTimeChange('end', e.target.value)}
            className={`w-full border-2 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:outline-none transition-colors ${
              controlMode === '自動'
                ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                : 'border-blue-600 focus:border-blue-700 shadow-xs'
            }`}
          />
          <Calendar size={18} className={`absolute right-3 top-3.5 pointer-events-none ${controlMode === '自動' ? 'text-slate-400' : 'text-blue-600'}`} />
        </div>
      </div>

      {/* 報到寬限分鐘 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          報到寬限分鐘
        </label>
        <div className="flex items-center justify-between border border-slate-300 rounded-xl p-2 bg-white">
          <span className="font-mono text-base font-bold text-slate-900 px-3">
            {graceMinutes}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGraceChange(-1)}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleGraceChange(1)}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 現場排隊開放 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          現場排隊開放
        </label>
        <select
          value={allowWalkIn ? '開放' : '關閉'}
          onChange={e => handleWalkInChange(e.target.value === '開放')}
          className="w-full border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:outline-none"
        >
          <option value="開放">開放</option>
          <option value="關閉">關閉</option>
        </select>
      </div>

      {/* 底部操作按鈕 */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? '儲存中...' : 'Save'}
        </button>
      </div>
    </form>
  );
};
