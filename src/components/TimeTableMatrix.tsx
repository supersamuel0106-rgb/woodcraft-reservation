/**
 * 時段選擇矩陣元件 (TimeTableMatrix)
 * 
 * 核心特性：
 * 1. 動態依照系統設定的有效課程時段 (自動模式 09:00~12:00 或手動自訂時段) 產生小時與分鐘槽位
 * 2. 精確判定：○ 可選、● 選定、■ 已占用、- 非課程時段
 * 3. 防呆校驗：預約結束時間不可超出課程結束時間
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { timeToMinutes, minutesToTime, hasReservationConflict, getEffectiveCourseTimes } from '../domain/rules';

interface TimeTableMatrixProps {
  machineId: string;
  durationMinutes: number;
  selectedStartSlot?: string;
  onSelectSlot: (slotId: string) => void;
}

const MINUTES_STEP = [0, 10, 20, 30, 40, 50];

export const TimeTableMatrix: React.FC<TimeTableMatrixProps> = ({
  machineId,
  durationMinutes,
  selectedStartSlot,
  onSelectSlot
}) => {
  const { reservations, systemSettings } = useApp();

  // 計算有效課程時段的分鐘數範圍
  const effectiveTimes = getEffectiveCourseTimes(systemSettings);
  const courseStartMin = effectiveTimes.startTime.getHours() * 60 + effectiveTimes.startTime.getMinutes();
  const courseEndMin = effectiveTimes.endTime.getHours() * 60 + effectiveTimes.endTime.getMinutes();

  // 動態推算需要顯示的小時清單
  const startHour = Math.floor(courseStartMin / 60);
  const endHour = Math.floor((Math.max(courseEndMin, courseStartMin + 10) - 1) / 60);

  const hoursList: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hoursList.push(h);
  }

  const selectedStartMinutes = selectedStartSlot ? timeToMinutes(selectedStartSlot) : null;

  // 取得特定時間槽位 (slotMinutes) 之狀態
  const getSlotInfo = (slotMinutes: number) => {
    const timeLabel = minutesToTime(slotMinutes);

    // 1. 超出課程時間範圍
    if (slotMinutes < courseStartMin || slotMinutes >= courseEndMin) {
      return { status: 'out_of_course', symbol: '·', label: timeLabel };
    }

    // 2. 已被當前預約區間選定
    if (
      selectedStartMinutes !== null &&
      slotMinutes >= selectedStartMinutes &&
      slotMinutes < selectedStartMinutes + durationMinutes
    ) {
      return { status: 'selected', symbol: '●', label: timeLabel };
    }

    // 3. 已被他人預約占用
    const isOccupied = reservations.some(r => {
      if (r.machineId !== machineId) return false;
      if (r.status === '已取消' || r.status === '已完成' || r.status === '未報到' || r.status === '逾時未到') return false;
      return slotMinutes >= r.startMinutes && slotMinutes < r.endMinutes;
    });

    if (isOccupied) {
      return { status: 'occupied', symbol: '■', label: timeLabel };
    }

    // 4. 空閒可預約
    return { status: 'available', symbol: '○', label: timeLabel };
  };

  const handleCellClick = (slotMinutes: number) => {
    // 檢查 1：是否在課程時間內
    if (slotMinutes < courseStartMin || slotMinutes >= courseEndMin) {
      return;
    }

    // 檢查 2：預約時長是否超出課程結束時間
    if (slotMinutes + durationMinutes > courseEndMin) {
      alert(
        `無法預約！\n預約時長 ${durationMinutes} 分鐘將會超過本次課程結束時間 (${minutesToTime(courseEndMin)})！\n請選擇較早的時段。`
      );
      return;
    }

    // 檢查 3：是否與他人預約衝突
    if (hasReservationConflict(reservations, machineId, slotMinutes, durationMinutes)) {
      alert(`時段衝突！\n從 ${minutesToTime(slotMinutes)} 開始的 ${durationMinutes} 分鐘已有其他同學預約，請選擇其他時段！`);
      return;
    }

    onSelectSlot(minutesToTime(slotMinutes));
  };

  return (
    <div className="space-y-2">
      {/* 標題與圖例 */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span>
          課程時段矩陣 ({minutesToTime(courseStartMin)} ～ {minutesToTime(courseEndMin)})：
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-600 font-bold">○ 可選</span>
          <span className="text-blue-600 font-bold">● 選定 ({Math.ceil(durationMinutes / 10)}格)</span>
          <span className="text-slate-400 font-bold">■ 已占用</span>
        </div>
      </div>

      {/* 矩陣表格 */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-2 px-2 border-r border-slate-200 w-16">小時</th>
              {MINUTES_STEP.map(m => (
                <th key={m} className="py-2 px-1 border-r border-slate-100 last:border-r-0">
                  :{m.toString().padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hoursList.map(hNum => {
              const hStr = hNum.toString().padStart(2, '0');
              return (
                <tr key={hNum} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-2 font-bold text-slate-700 bg-slate-50/80 border-r border-slate-200 text-xs">
                    {hStr}:00
                  </td>
                  {MINUTES_STEP.map(mStep => {
                    const slotMin = hNum * 60 + mStep;
                    const info = getSlotInfo(slotMin);

                    let cellStyle = 'text-slate-200 bg-slate-50/40 cursor-not-allowed select-none';
                    if (info.status === 'selected') {
                      cellStyle = 'bg-blue-600 text-white font-bold cursor-pointer shadow-inner';
                    } else if (info.status === 'occupied') {
                      cellStyle = 'text-slate-400 bg-slate-100/90 font-bold cursor-not-allowed';
                    } else if (info.status === 'available') {
                      cellStyle = 'text-emerald-600 hover:bg-emerald-50 cursor-pointer font-bold transition-colors';
                    }

                    return (
                      <td
                        key={mStep}
                        className={`py-2 px-1 border-r border-slate-100 last:border-r-0 text-sm select-none ${cellStyle}`}
                        onClick={() => info.status === 'available' && handleCellClick(slotMin)}
                        title={`${info.label} ${
                          info.status === 'out_of_course' ? '(非課程時段)' : info.status === 'occupied' ? '(已占用)' : '(可預約)'
                        }`}
                      >
                        {info.symbol}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 已選區間資訊 */}
      {selectedStartSlot && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium animate-in fade-in">
          <span>
            已選時段：<strong>{selectedStartSlot}</strong> ～{' '}
            <strong>{minutesToTime(timeToMinutes(selectedStartSlot) + durationMinutes)}</strong>
          </span>
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
            共 {durationMinutes} 分鐘
          </span>
        </div>
      )}
    </div>
  );
};
