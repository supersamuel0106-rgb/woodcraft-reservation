/**
 * 新增預約與現場排隊彈窗 (ReservationModal)
 * 
 * 嚴格遵循業務規則：
 * • 課程開始前 24 小時：只能進行「時段預約」
 * • 課程開始時 (進行中)：只能進行「現場排隊」
 * • 非上課時段送出現場排隊時，顯示清楚中文提示「現在是非上課時段，不能進行現場排隊預約」
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ReservationType } from '../types';
import { TimeTableMatrix } from './TimeTableMatrix';
import { 
  calculateUsageMinutes, 
  calculateDynamicQueueStart, 
  minutesToTime, 
  getCurrentBookingPhase,
  getEffectiveCourseTimes,
  formatDateTime
} from '../domain/rules';
import { X, Calendar, Clock, Users, CheckCircle2, Info, Lock, AlertTriangle } from 'lucide-react';

interface ReservationModalProps {
  initialMachineId?: string;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ initialMachineId, onClose }) => {
  const { machines, students, activeUser, reservations, systemSettings, createReservation } = useApp();

  // 計算有效課程時間與預約階段
  const effectiveTimes = getEffectiveCourseTimes(systemSettings);
  const phaseInfo = getCurrentBookingPhase(systemSettings);

  const courseStartMin = effectiveTimes.startTime.getHours() * 60 + effectiveTimes.startTime.getMinutes();
  const courseEndMin = effectiveTimes.endTime.getHours() * 60 + effectiveTimes.endTime.getMinutes();

  const [selectedMachineId, setSelectedMachineId] = useState<string>(initialMachineId || machines[0]?.id || '帶鋸機');
  
  // 依據目前時間階段自動預設預約類型
  const [reservationType, setReservationType] = useState<ReservationType>(
    phaseInfo.allowedType === '現場排隊' ? '現場排隊' : '時段預約'
  );
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([activeUser.name]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(minutesToTime(courseStartMin));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 學生人數與使用時長計算
  const durationMinutes = calculateUsageMinutes(selectedStudents.length);
  const queueStartMinutes = calculateDynamicQueueStart(reservations, selectedMachineId, durationMinutes, courseEndMin);

  // 判斷 Tab 是否受限
  const isSlotAllowed = phaseInfo.phase === 'SLOT_ONLY';
  const isQueueAllowed = phaseInfo.phase === 'QUEUE_ONLY' && systemSettings?.allowWalkInQueue !== false;

  useEffect(() => {
    if (phaseInfo.phase === 'QUEUE_ONLY') {
      setReservationType('現場排隊');
    } else if (phaseInfo.phase === 'SLOT_ONLY') {
      setReservationType('時段預約');
    }
  }, [phaseInfo.phase]);

  const handleStudentToggle = (studentName: string) => {
    if (selectedStudents.includes(studentName)) {
      if (selectedStudents.length === 1) {
        alert('預約必須至少包含一位學生！');
        return;
      }
      setSelectedStudents(prev => prev.filter(s => s !== studentName));
    } else {
      setSelectedStudents(prev => [...prev, studentName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMachineId) {
      alert('請選擇預約機台！');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('請至少選擇一位學生！');
      return;
    }

    // 業務防呆驗證 (友善繁體中文提示)
    if (reservationType === '現場排隊') {
      if (phaseInfo.phase !== 'QUEUE_ONLY') {
        alert(
          `⚠️ 現在是非上課時段，不能進行現場排隊預約！\n\n• 現場排隊開放時段：課程進行中 (${formatDateTime(effectiveTimes.startTime)} ～ ${formatDateTime(effectiveTimes.endTime)})\n• 如需預約下堂課，請於開課前 24 小時使用「時段預約」。`
        );
        return;
      }
      if (systemSettings?.allowWalkInQueue === false) {
        alert('⚠️ 目前系統已關閉現場排隊功能，請洽授課老師/助教！');
        return;
      }
    }

    if (reservationType === '時段預約') {
      if (phaseInfo.phase !== 'SLOT_ONLY') {
        if (phaseInfo.phase === 'QUEUE_ONLY') {
          alert(`⚠️ 課程已開始進行中，目前僅開放「現場排隊」，時段預約已截止！`);
        } else if (phaseInfo.phase === 'NOT_OPEN') {
          alert(`⚠️ 現在非時段預約開放時間！\n\n系統將於課程開始前 24 小時（${formatDateTime(effectiveTimes.openBookingTime)}）正式開放時段預約。`);
        } else {
          alert(`⚠️ 本次課程已經結束，不再接受預約！`);
        }
        return;
      }

      if (!selectedSlotId) {
        alert('請於時段矩陣中點選開始預約之時段！');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await createReservation({
        machineId: selectedMachineId,
        type: reservationType,
        students: selectedStudents,
        timeSlotId: selectedSlotId
      });

      if (!res.success) {
        alert(`❌ 預約失敗：${res.message}`);
      } else {
        alert(`✅ ${res.message}`);
        onClose();
      }
    } catch (err: any) {
      alert(`❌ 系統提示：${err.message || '預約處理發生錯誤'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Modal 頂部 Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">新增機台預約 / 現場排隊</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                課程時間：{formatDateTime(effectiveTimes.startTime)} ～ {formatDateTime(effectiveTimes.endTime)}
              </p>
            </div>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition-colors" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* 目前開放狀態提示 Banner */}
          <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
            phaseInfo.phase === 'SLOT_ONLY'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : phaseInfo.phase === 'QUEUE_ONLY'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {phaseInfo.phase === 'QUEUE_ONLY' ? (
              <Clock size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : phaseInfo.phase === 'SLOT_ONLY' ? (
              <Calendar size={16} className="shrink-0 mt-0.5 text-blue-600" />
            ) : (
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            )}
            <div>
              <div className="font-bold">{phaseInfo.title}</div>
              <div className="text-[11px] opacity-90 mt-0.5">{phaseInfo.description}</div>
            </div>
          </div>

          {/* 模式切換頁籤 (Tab) - 連動限制 */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              type="button"
              className={`py-2 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                reservationType === '時段預約' 
                  ? 'bg-white text-blue-600 shadow-xs' 
                  : isSlotAllowed
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 bg-slate-100/50 cursor-pointer'
              }`}
              onClick={() => setReservationType('時段預約')}
            >
              <Calendar size={15} />
              <span>時段預約 (24h前開放)</span>
              {!isSlotAllowed && <Lock size={12} className="text-slate-400" />}
            </button>

            <button
              type="button"
              className={`py-2 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                reservationType === '現場排隊' 
                  ? 'bg-white text-blue-600 shadow-xs' 
                  : isQueueAllowed
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 bg-slate-100/50 cursor-pointer'
              }`}
              onClick={() => setReservationType('現場排隊')}
            >
              <Clock size={15} />
              <span>現場排隊 (上課時開放)</span>
              {!isQueueAllowed && <Lock size={12} className="text-slate-400" />}
            </button>
          </div>

          {/* 機台選擇 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              選擇預約機台：
            </label>
            <select
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={selectedMachineId}
              onChange={e => setSelectedMachineId(e.target.value)}
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.status === '空閒' ? '🟢 空閒' : m.status === '使用中' ? '🔴 使用中' : '🟡 等待報到'})
                </option>
              ))}
            </select>
          </div>

          {/* 學生名單多選 (連動人數與使用時間計算) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Users size={14} />
                參與同學清單 (連動使用時長)：
              </label>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {selectedStudents.length} 人 ➔ {durationMinutes} 分鐘
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              {students.map(s => {
                const isSelected = selectedStudents.includes(s.name);
                return (
                  <label 
                    key={s.id} 
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={isSelected}
                      onChange={() => handleStudentToggle(s.name)}
                    />
                    <span>{s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 依申請方式展示對應介面 */}
          {reservationType === '時段預約' ? (
            <TimeTableMatrix
              machineId={selectedMachineId}
              durationMinutes={durationMinutes}
              selectedStartSlot={selectedSlotId}
              onSelectSlot={slotId => setSelectedSlotId(slotId)}
            />
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Clock size={16} />
                <span>現場排隊即時推算：</span>
              </div>
              <p className="text-emerald-800">
                目前課程進行中，依據機台現有隊列為您推算之預計開始時間為：
              </p>
              <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-sm text-center font-bold text-slate-900">
                {minutesToTime(queueStartMinutes)} ～ {minutesToTime(queueStartMinutes + durationMinutes)}
                <span className="text-xs font-normal text-slate-500 block mt-0.5">
                  (當前使用者結束後系統將自動叫號通知)
                </span>
              </div>
            </div>
          )}

          {/* 底部按鈕 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              {isSubmitting ? '預約中...' : '確認送出申請'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
